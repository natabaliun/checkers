// Файл: backend/src/infrastructure/http/routes/auth.routes.ts

import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../validators/userValidators';
import { config } from '../../../shared/config';

const router = Router();

// Локальная регистрация и вход (без изменений)
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// --- НОВЫЕ РОУТЫ ДЛЯ GOOGLE AUTH ---

// 1. Роут, который инициирует процесс аутентификации
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'], // Запрашиваем у пользователя доступ к профилю и email
    session: false
}));

// 2. Роут, на который Google перенаправит пользователя после успешного входа
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${config.clientUrl}/login`, // Куда перенаправить при ошибке
        session: false
    }),
    (req: Request, res: Response) => {
        // Если аутентификация успешна, req.user будет содержать объект пользователя
        if (!req.user) {
            return res.redirect(`${config.clientUrl}/login?error=auth_failed`);
        }

        const user = req.user as any;

        // Создаем наш собственный JWT для этого пользователя
        const payload = { id: user.id, role: user.role };
        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

        // Перенаправляем пользователя на специальную страницу на фронтенде с токеном
        res.redirect(`${config.clientUrl}/auth/callback?token=${token}`);
    }
);

export { router as authRoutes };