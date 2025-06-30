// Файл: backend/src/infrastructure/http/controllers/user.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../../database/prisma';

export const userController = {
    async getMe(req: Request, res: Response) {
        // req.user добавляется middleware-ом passport
        const user = req.user as any;
        // Удаляем хеш пароля перед отправкой
        const { passwordHash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    },

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;
            const profileData = req.body;

            const updatedProfile = await prisma.userProfile.update({
                where: { userId },
                data: profileData,
            });

            res.json(updatedProfile);
        } catch (error) {
            res.status(500).json({ message: 'Error updating profile', error });
        }
    },

    async uploadAvatar(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).send({ message: 'Please upload a file.' });
        }

        try {
            const userId = (req.user as any).id;
            // Сохраняем путь к файлу в профиле пользователя
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;

            await prisma.userProfile.update({
                where: { userId },
                data: { avatarUrl },
            });

            res.status(200).send({ message: 'Avatar uploaded successfully', avatarUrl });
        } catch (error) {
            res.status(500).send({ message: 'Error saving avatar info', error });
        }
    }
};