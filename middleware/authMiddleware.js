import jwt from 'jsonwebtoken';
import User from '../model/userModal.js';

export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};