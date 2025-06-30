import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/user';

// Очень упрощенный репозиторий для примера
const prisma = new PrismaClient();

export const userRepository = {
    async findById(id: string): Promise<User | null> {
        // ... логика поиска
        return null;
    },
    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email }, include: { profile: true } });
    },
    async findByNickname(nickname: string) {
        return prisma.user.findUnique({ where: { nickname } });
    },
    async save(user: Omit<User, 'id' | 'profile'>, profileData?: any) {
        return prisma.user.create({
            data: {
                ...user,
                profile: {
                    create: profileData || {},
                },
            },
        });
    },
    // ... другие методы
};