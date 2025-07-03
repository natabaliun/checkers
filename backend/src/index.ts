// Файл: backend/src/index.ts

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import passport from 'passport';
import { config } from './shared/config';
import { authRoutes } from './infrastructure/http/routes/auth.routes';
import { userRoutes } from './infrastructure/http/routes/user.routes';
import { gameRoutes } from './infrastructure/http/routes/game.routes'; // <-- Импорт
import { setupGameGateway } from './infrastructure/websocket/game.gateway';
import './infrastructure/http/middlewares/auth.middleware';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes); // <-- Подключение

setupGameGateway(io);

server.listen(config.port, () => {
    console.log(`Backend server with WebSocket is running on http://localhost:${config.port}`);
});