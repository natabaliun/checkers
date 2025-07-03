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

    const broadcastGameState = (gameId: string) => {
        const game = gameManager.getGame(gameId);
        if (!game) return;
        const roomSockets = gameNsp.in(gameId);

        roomSockets.fetchSockets().then(sockets => {
            sockets.forEach(socket => {
                const userId = socket.handshake.query.userId as string;
                socket.emit('game:state_update', game.getState(userId));
            });
        }).catch(err => console.error("Error fetching sockets:", err));
    };

    lobbyNsp.on('connection', async (socket) => {
        console.log(`Socket connected to lobby: ${socket.id}`);
        await broadcastLobbyUpdate();
        socket.on('disconnect', () => console.log(`Socket disconnected from lobby: ${socket.id}`));
    });

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
                // --- ЛОГ 2 ---
                console.log("LOBBY (Join): Received callback data:", data);

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

            // --- ЛОГ 2 ---
            console.log(`GATEWAY (Join): Calling back client ${userId} with data:`, game.getState(userId));

            if(callback) callback(game.getState(userId));
            await broadcastLobbyUpdate();
        });

        socket.on('game:move', async ({ gameId, userId, move }) => {
            const game = gameManager.getGame(gameId);
            if (!game) return socket.emit('error', { message: "Game not found" });

            try {
                const isFinished = game.makeMove(userId, move);
                broadcastGameState(gameId);

                if (isFinished) {
                    console.log(`Game ${gameId} finished. Result: ${game.result?.winner} wins.`);
                    gameNsp.to(gameId).emit('game:ended', game.getState(userId)); // Отправляем финальное состояние
                    await gameManager.finishGame(gameId);
                    await broadcastLobbyUpdate();
                }

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