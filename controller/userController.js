import User from '../model/userModal.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d',
    });
};

export default {
    userRegister: async (req, res) => {
        console.log('Register request body----->:', req.get('host'));
        try {
            const { name, email, password, phone } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'Name, email and password are required' });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'User already exists with this email' });
            }

            const avatarUrl = req.file ? `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\\\/g, '/')}` : '';

            // Generate email verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

            const user = await User.create({
                name,
                email,
                password,
                phone,
                avatar: avatarUrl,
                isEmailVerified: false,
                emailVerificationToken: hashedToken,
                emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
            });

            // Send verification email
            const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/verify-email?token=${verificationToken}`;
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Verify your email',
                    html: `
                        <p>Please verify your email by clicking the link below:</p>
                        <a href="${verificationUrl}">Verify Email</a>
                        <p>This link will expire in 10 minutes.</p>
                    `,
                });

                res.status(201).json({
                    success: true,
                    message: 'User registered successfully. Please check your email to verify your account.',
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Still create user but inform about email issue
                console.log('Email sending failed:', emailError);
                res.status(201).json({
                    success: true,
                    message: 'User registered successfully. However, there was an issue sending the verification email. Please contact support.',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    userLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Email and password are required' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            if (!user.isEmailVerified) {
                return res.status(401).json({ success: false, message: 'Please verify your email before logging in.' });
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            user.lastLogin = Date.now();
            await user.save();

            const token = generateToken(user._id);

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            };
            res.cookie('token', token, cookieOptions);

            res.status(200).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    // Returns user info (requires auth middleware to set req.user)
    userProfile: async (req, res) => {
        if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
        res.status(200).json({ success: true, user: req.user });
    },

    userUpdateAvatar: async (req, res) => {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

            const avatarUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\\\/g, '/')} `;
            req.user.avatar = avatarUrl.trim();
            await req.user.save();

            res.status(200).json({ success: true, avatar: req.user.avatar });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.query;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token is required' });
            }

            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const user = await User.findOne({
                emailVerificationToken: hashedToken,
                emailVerificationExpires: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
            }

            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

            res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },

    resendVerificationEmail: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.isEmailVerified) {
                return res.status(400).json({ success: false, message: 'Email is already verified' });
            }

            // Generate new token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

            user.emailVerificationToken = hashedToken;
            user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            // Send verification email
            const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/verify-email?token=${verificationToken}`;
            try {
                await sendEmail({
                    to: user.email,
                    subject: 'Verify your email',
                    html: `
                        <p>Please verify your email by clicking the link below:</p>
                        <a href="${verificationUrl}">Verify Email</a>
                        <p>This link will expire in 10 minutes.</p>
                    `,
                });

                res.status(200).json({ success: true, message: 'Verification email sent successfully.' });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    },
};
