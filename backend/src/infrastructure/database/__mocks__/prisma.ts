// Файл: backend/src/infrastructure/database/__mocks__/prisma.ts
// Jest будет автоматически использовать этот файл вместо реального prisma.ts в тестах.
// Важно, чтобы он находился в папке __mocks__ рядом с оригинальным файлом.

export const prisma = {
    user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    userProfile: {
        update: jest.fn(),
    },
    activeGame: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    completedGame: {
        create: jest.fn(),
    }
};