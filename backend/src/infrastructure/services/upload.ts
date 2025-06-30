// backend/src/infrastructure/services/upload.ts
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => {
        cb(null, `${(req.user as any).id}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

export const upload = multer({ storage });