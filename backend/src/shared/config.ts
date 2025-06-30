// Файл: backend/src/shared/config.ts

import dotenv from 'dotenv';
dotenv.config();

export const config = {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-env-file',
    port: process.env.PORT || 3001,
};