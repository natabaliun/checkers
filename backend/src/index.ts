// Файл: backend/src/index.ts

import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { config } from './shared/config';
import { authRoutes } from './infrastructure/http/routes/auth.routes';
import { userRoutes } from './infrastructure/http/routes/user.routes';
import './infrastructure/http/middlewares/auth.middleware'; // для инициализации passport

const app = express();

app.use(cors()); // Включаем CORS для всех запросов
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

// Раздача статичных файлов (аватаров)
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Подключаем роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(config.port, () => {
    console.log(`Backend server is running on http://localhost:${config.port}`);
});