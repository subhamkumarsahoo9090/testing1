import User from '../model/userModal.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '7d',
    });
};

export default {
    userRegister: async (req, res) => {
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
            const user = await User.create({ name, email, password, phone, avatar: avatarUrl });

            const token = generateToken(user._id);

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            };
            res.cookie('token', token, cookieOptions);

            res.status(201).json({
                success: true,
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                },
            });
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
};