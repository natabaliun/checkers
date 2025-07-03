// Файл: backend/src/index.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import { config } from './shared/config';
import { authRoutes } from './infrastructure/http/routes/auth.routes';
import { userRoutes } from './infrastructure/http/routes/user.routes';
import './infrastructure/http/middlewares/auth.middleware'; // для инициализации passport
import { setupGameGateway } from './infrastructure/websocket/game.gateway';


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // URL вашего фронтенда
        methods: ["GET", "POST"]
    }
});

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

// Подключение Gateway
setupGameGateway(io);

// Вместо app.listen используем server.listen
server.listen(config.port, () => {
    console.log(`Backend server with WebSocket is running on http://localhost:${config.port}`);
});