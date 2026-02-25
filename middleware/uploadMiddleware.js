import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'avatars');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
};

export const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});
