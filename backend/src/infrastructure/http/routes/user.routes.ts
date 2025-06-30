// Файл: backend/src/infrastructure/http/routes/user.routes.ts

import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { updateUserProfileSchema } from '../validators/userValidators';
import multer from 'multer';
import path from 'path';

const router = Router();

// Настройка Multer
const storage = multer.diskStorage({
    destination: './uploads/avatars',
    filename: (req, file, cb) => {
        // Используем ID пользователя из токена для имени файла, чтобы предотвратить перезапись
        const uniqueSuffix = `user-${(req.user as any).id}-${Date.now()}`;
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

router.get('/me', isAuthenticated, userController.getMe);
router.put('/me', isAuthenticated, validate(updateUserProfileSchema), userController.updateProfile);
router.post('/me/avatar', isAuthenticated, upload.single('avatar'), userController.uploadAvatar);

export { router as userRoutes };