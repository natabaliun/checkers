// Файл: backend/src/shared/config.ts

import dotenv from 'dotenv';
dotenv.config();

export const config = {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key',
    port: process.env.PORT || 3001,

    // --- НОВЫЙ ОБЪЕКТ ---
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },

    // Адрес вашего фронтенд-приложения
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};