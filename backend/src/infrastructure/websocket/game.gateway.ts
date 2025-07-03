// Файл: backend/src/infrastructure/websocket/game.gateway.ts

import { Server, Socket } from 'socket.io';
import { gameManager } from '../../application/game/GameManager';
import { GameInstance } from '../../application/game/GameInstance'; // Импортируем для типизации

export function setupGameGateway(io: Server) {
    const lobbyNsp = io.of("/lobby");
    const gameNsp = io.of("/game");

    // Хелпер для рассылки обновлений в лобби
    const broadcastLobbyUpdate = async () => {
        const games = await gameManager.getLobbyGames();
        lobbyNsp.emit('lobby:games_list', games);
    };

    // Хелпер для персональной рассылки состояния игры каждому участнику
    const broadcastGameState = (gameId: string) => {
        const game = gameManager.getGame(gameId);
        if (!game) return;

        const roomSockets = gameNsp.in(gameId);

        roomSockets.fetchSockets().then(sockets => {
            sockets.forEach(socket => {
                const userId = socket.handshake.query.userId as string;
                socket.emit('game:state_update', game.getState(userId));
            });
        }).catch(err => console.error("Error fetching sockets for broadcast:", err));
    };

    // Асинхронный хелпер для обработки полного хода бота, включая серии взятий
    const handleBotTurn = async (game: GameInstance, humanPlayerId: string) => {
        if (!game.isPve || game.turn !== game.bot?.color) {
            return;
        }

        // Цикл для обработки "длинного боя"
        while (game.turn === game.bot?.color && game.status === 'PLAYING') {
            // Добавляем задержку для "человечности"
            await new Promise(resolve => setTimeout(resolve, 1000));

            const botMove = game.bot.findBestMove(game.board, game.rules);

            // Если боту некуда ходить, значит, он проиграл
            if (!botMove) {
                console.log(`Bot has no moves in game ${game.id}. Finishing.`);
                game.status = 'FINISHED';
                game.result = { winner: 'WHITE', reason: 'NO_MOVES' }; // Человек (белые) всегда побеждает в этом случае
                broadcastGameState(game.id);
                gameNsp.to(game.id).emit('game:ended', game.getState(humanPlayerId));
                await gameManager.finishGame(game.id);
                await broadcastLobbyUpdate();
                break; // Выходим из цикла
            }

            try {
                const isFinished = game.makeMove('bot-player', botMove);
                broadcastGameState(game.id); // Отправляем обновление после каждого сегмента боя

                if (isFinished) {
                    gameNsp.to(game.id).emit('game:ended', game.getState(humanPlayerId));
                    await gameManager.finishGame(game.id);
                    await broadcastLobbyUpdate();
                    break; // Выходим из цикла
                }
            } catch (e) {
                console.error(`Bot error in game ${game.id}:`, e);
                break; // Выходим из цикла при внутренней ошибке бота
            }
        }
    };

    // --- Namespace для Лобби ---
    lobbyNsp.on('connection', async (socket) => {
        console.log(`Socket connected to lobby: ${socket.id}`);
        await broadcastLobbyUpdate();
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
            socket.emit('game:reconnect', activeGame.getState(userId));
        }

        socket.on('game:create', async (data, callback) => {
            try {
                const newGame = await gameManager.createGame(data.userId);
                socket.join(newGame.id);
                if (callback) callback(newGame.getState(data.userId));
                await broadcastLobbyUpdate();
            } catch (error) {
                console.error("Error creating game:", error);
                if (callback) callback({ error: "Failed to create game on server." });
            }
        });

        socket.on('game:join', async ({ gameId, userId }, callback) => {
            const game = await gameManager.joinGame(gameId, userId);
            if (!game) {
                if(callback) callback({ error: 'Game not found' });
                return;
            }

            socket.join(gameId);
            broadcastGameState(gameId);
            if(callback) callback(game.getState(userId));
            await broadcastLobbyUpdate();
        });

        socket.on('game:start_pve', async ({ gameId, userId }) => {
            const game = gameManager.getGame(gameId);
            if (!game || game.players.WHITE !== userId) return;

            const botColor = game.addBot();
            if (botColor) {
                await gameManager.assignBotToGame(gameId, 'bot-player');
                broadcastGameState(gameId);
                await broadcastLobbyUpdate();
            }
        });

        socket.on('game:move', async ({ gameId, userId, move }) => {
            const game = gameManager.getGame(gameId);
            if (!game) return socket.emit('error', { message: "Game not found" });

            try {
                let isFinished = game.makeMove(userId, move);
                broadcastGameState(gameId);

                if (isFinished) {
                    gameNsp.to(gameId).emit('game:ended', game.getState(userId));
                    await gameManager.finishGame(gameId);
                    await broadcastLobbyUpdate();
                    return;
                }

                // Запускаем ход бота. Он сам обработает всю серию взятий.
                await handleBotTurn(game, userId);

            } catch (error: any) {
                console.log(`Invalid move by ${userId} in game ${gameId}: ${error.message}`);
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('game:resign', async ({ gameId, userId }) => {
            const game = gameManager.getGame(gameId);
            if (!game) return;

            const wasResigned = game.resign(userId);
            if (wasResigned) {
                broadcastGameState(gameId);
                gameNsp.to(gameId).emit('game:ended', game.getState(userId));
                await gameManager.finishGame(gameId);
                await broadcastLobbyUpdate();
            }
        });
    });
}