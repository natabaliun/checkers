// Файл: backend/src/infrastructure/websocket/game.gateway.ts

import { Server, Socket } from 'socket.io';
import { gameManager } from '../../application/game/GameManager';

const MOCK_GAME_ID = 'game123';

export function setupGameGateway(io: Server) {
    // Убедимся, что игра существует при старте сервера
    gameManager.findOrCreateGame(MOCK_GAME_ID);

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('game:join', ({ gameId, userId }) => {
            if (gameId !== MOCK_GAME_ID) return socket.emit('error', 'Game not found');

            const game = gameManager.findOrCreateGame(gameId);

            socket.join(gameId);
            const playerAdded = game.addPlayer(userId);

            if (playerAdded) {
                console.log(`User ${userId} assigned to game ${gameId}`);
            } else {
                console.log(`User ${userId} is observing game ${gameId}`);
            }

            // Если после добавления игрока игра готова, отправляем всем состояние
            if (game.isReady()) {
                io.to(gameId).emit('game:state_update', {
                    fen: game.board.toFen(),
                    turn: game.turn,
                    players: game.playerColors, // Отправляем маппинг цветов
                });
            }
        });

        socket.on('game:move', ({ gameId, userId, move }) => {
            const game = gameManager.getGame(gameId);
            if (!game) return socket.emit('error', 'Game not found');

            const playerColor = game.playerColors[userId];
            if (game.turn !== playerColor) {
                return socket.emit('error', { message: 'Not your turn' });
            }

            // ... (та же упрощенная логика хода)
            try {
                const isCapture = Math.abs(move.from.row - move.to.row) === 2;
                if (isCapture) {
                    game.board.removePieceAt({
                        row: (move.from.row + move.to.row) / 2,
                        col: (move.from.col + move.to.col) / 2
                    });
                }
                game.board.movePiece(move.from, move.to);
                game.turn = game.turn === 'WHITE' ? 'BLACK' : 'WHITE';

                io.to(gameId).emit('game:state_update', {
                    fen: game.board.toFen(),
                    turn: game.turn,
                    players: game.playerColors,
                });
            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
}