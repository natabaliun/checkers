// Файл: backend/src/infrastructure/http/controllers/auth.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/prisma';
import { config } from '../../../shared/config';

export const authController = {
    async register(req: Request, res: Response) {
        try {
            const { email, nickname, password } = req.body;

            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ email }, { nickname }] },
            });
            if (existingUser) {
                return res.status(400).json({ message: 'User with this email or nickname already exists' });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    email,
                    nickname,
                    passwordHash,
                    profile: {
                        create: {}, // Создаем пустой профиль
                    },
                },
            });

            res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
        } catch (error) {
            res.status(500).json({ message: 'Server error during registration', error });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { email },
                include: { profile: true },
            });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const payload = { id: user.id, role: user.role };
            const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

            // Не отправляем хеш пароля на клиент
            const { passwordHash, ...userWithoutPassword } = user;

            res.json({ token, user: userWithoutPassword });
        } catch (error) {
            res.status(500).json({ message: 'Server error during login', error });
        }
    }
};