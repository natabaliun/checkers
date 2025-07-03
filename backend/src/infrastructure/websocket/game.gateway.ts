// Файл: backend/src/infrastructure/websocket/game.gateway.ts

import { Server, Socket } from 'socket.io';
import { gameManager } from '../../application/game/GameManager';

export function setupGameGateway(io: Server) {
    const lobbyNsp = io.of("/lobby");
    const gameNsp = io.of("/game");

    const broadcastLobbyUpdate = async () => {
        const games = await gameManager.getLobbyGames();
        lobbyNsp.emit('lobby:games_list', games);
    };

    // --- НОВЫЙ ХЕЛПЕР ДЛЯ ПЕРСОНАЛЬНОЙ РАССЫЛКИ СОСТОЯНИЯ ИГРЫ ---
    const broadcastGameState = (gameId: string) => {
        const game = gameManager.getGame(gameId);
        if (!game) return;

        // Получаем все сокеты в игровой комнате
        const roomSockets = gameNsp.in(gameId);

        // Для каждого сокета в комнате отправляем персональное состояние
        roomSockets.fetchSockets().then(sockets => {
            sockets.forEach(socket => {
                // Извлекаем userId из данных подключения сокета
                const userId = socket.handshake.query.userId as string;
                // Отправляем событие с состоянием, вычисленным для этого userId
                socket.emit('game:state_update', game.getState(userId));
            });
        }).catch(err => console.error("Error fetching sockets:", err));
    };

    // --- Namespace для Лобби ---
    lobbyNsp.on('connection', async (socket) => {
        console.log(`Socket connected to lobby: ${socket.id}`);

        await broadcastLobbyUpdate();

        socket.on('lobby:get_initial_list', async () => {
            await broadcastLobbyUpdate();
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected from lobby: ${socket.id}`);
        });
    });

    // --- Namespace для Игры ---
    gameNsp.on('connection', (socket: Socket) => {
        const userId = socket.handshake.query.userId as string;
        if (!userId) {
            socket.disconnect();
            return;
        }

        console.log(`Socket connected to game namespace: ${socket.id}, User: ${userId}`);

        const activeGame = gameManager.getGameByUserId(userId);
        if (activeGame) {
            socket.join(activeGame.id);
            // При переподключении отправляем персональное состояние
            socket.emit('game:reconnect', activeGame.getState(userId));
        }

        socket.on('game:create', async (data, callback) => {
            try {
                const newGame = await gameManager.createGame(data.userId);
                socket.join(newGame.id);
                if (callback) {
                    callback(newGame.getState(data.userId));
                }
                await broadcastLobbyUpdate();
            } catch (error) {
                console.error("Error creating game:", error);
                if (callback) {
                    callback({ error: "Failed to create game on server." });
                }
            }
        });

        socket.on('game:join', async ({ gameId, userId }, callback) => {
            const game = await gameManager.joinGame(gameId, userId);
            if (!game) {
                if(callback) callback({ error: 'Game not found' });
                return;
            }

            socket.join(gameId);

            // --- ИСПОЛЬЗУЕМ НОВЫЙ ХЕЛПЕР ---
            broadcastGameState(gameId);

            if(callback) callback(game.getState(userId));
            await broadcastLobbyUpdate();
        });

        socket.on('game:move', ({ gameId, userId, move }) => {
            const game = gameManager.getGame(gameId);
            if (!game) return;

            // Проверяем, является ли отправитель игроком
            const playerColor = game.playerColors ? game.playerColors[userId] : null;
            if (!playerColor) {
                return socket.emit('error', { message: 'You are not a player in this game.' });
            }

            // Проверяем, его ли сейчас ход
            if (game.turn !== playerColor) {
                return socket.emit('error', { message: 'Not your turn' });
            }

            try {
                // Здесь в будущем будет валидация хода
                game.makeMove(move.from, move.to);

                // --- ИСПОЛЬЗУЕМ НОВЫЙ ХЕЛПЕР ---
                broadcastGameState(gameId);

            } catch (error: any) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('game:finish', async({gameId}) => {
            await gameManager.finishGame(gameId);
            await broadcastLobbyUpdate();
        })
    });
}