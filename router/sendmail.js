import express from 'express'
import sendAnyMailToMe, { sendOtpToUser } from '../utils/sendAnyMailToMe.js'

const router=express.Router()

router.post('/sendmailtome', async (req, res) => {
    const { email, subject, message } = req.body;

    try {
        await sendAnyMailToMe({
            email: email, 
            subject,
            html: `<p>${message}</p>`,
        });

        res.status(201).json({
            success: true,
            message: 'Email sent successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
        });
    }
});
router.post('/sendOtp', async (req, res) => {
    const { email } = req.body;

    try {
        // 1️⃣ Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // 2️⃣ Send Email
        await sendOtpToUser({
            to: email,
            subject: 'Your OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>OTP Verification</h2>
                    <p>Your One-Time Password (OTP) is:</p>
                    <h1 style="color: #4CAF50;">${otp}</h1>
                    <p>This OTP is valid for 5 minutes.</p>
                </div>
            `,
        });
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
        });
    }
});
export default router