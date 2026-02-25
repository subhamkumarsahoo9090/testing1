
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Create transporter once
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // true only for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ✅ Send mail to YOU (contact form)
const sendAnyMailToMe = async ({ email, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"${email}" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // always to you
            subject,
            html,
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// ✅ Send OTP to USER
export const sendOtpToUser = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"Your App" <${process.env.EMAIL_USER}>`,
            to: to, // send to user
            subject,
            html,
        });

        console.log('OTP Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};

export default sendAnyMailToMe;