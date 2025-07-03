// Файл: backend/src/infrastructure/websocket/game.gateway.ts

import { Server, Socket } from 'socket.io';
import { gameManager } from '../../application/game/GameManager';
import { GameInstance } from '../../application/game/GameInstance';
import { PlayerColor } from '../../domain/game/types';

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
                const userId = socket.handshake.auth.userId as string;
                socket.emit('game:state_update', game.getState(userId));
            });
        }).catch(err => console.error("Error fetching sockets for broadcast:", err));
    };

    const handleBotTurn = async (game: GameInstance) => {
        const humanPlayerId = game.players.WHITE !== 'bot-player' ? game.players.WHITE : game.players.BLACK;
        if (!game.isPve || game.turn !== game.bot?.color || !humanPlayerId) {
            return;
        }

        while (game.turn === game.bot?.color && game.status === 'PLAYING') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const botMove = game.bot.findBestMove(game.board, game.rules);

            if (!botMove) {
                game.status = 'FINISHED';
                game.result = { winner: game.bot.color === 'WHITE' ? 'BLACK' : 'WHITE', reason: 'NO_MOVES' };
                broadcastGameState(game.id);
                gameNsp.to(game.id).emit('game:ended', game.getState(humanPlayerId));
                await gameManager.finishGame(game.id);
                break;
            }

            try {
                const isFinished = game.makeMove('bot-player', botMove);
                broadcastGameState(game.id);
                if (isFinished) {
                    gameNsp.to(game.id).emit('game:ended', game.getState(humanPlayerId));
                    await gameManager.finishGame(game.id);
                    break;
                }
            } catch (e) {
                console.error(`Bot error in game ${game.id}:`, e);
                break;
            }
        }
    };

    lobbyNsp.on('connection', async (socket) => {
        console.log(`Socket connected to lobby: ${socket.id}`);
        await broadcastLobbyUpdate();
        socket.on('disconnect', () => console.log(`Socket disconnected from lobby: ${socket.id}`));
    });

    gameNsp.on('connection', (socket: Socket) => {
        console.log(`GATEWAY: New connection attempt to /game namespace. Socket ID: ${socket.id}`);
        // --- ЧИТАЕМ ИЗ 'auth' ВМЕСТО 'query' ---
        const userId = socket.handshake.auth.userId as string;
        console.log('GATEWAY: Handshake auth object received:', socket.handshake.auth);

        if (!userId) {
            console.error(`GATEWAY: Connection rejected for socket ${socket.id}. Reason: No userId in auth object.`);
            socket.disconnect();
            return;
        }

        console.log(`GATEWAY: Connection successful. User ID found: ${userId}`);

        const activeGame = gameManager.getGameByUserId(userId);
        if (activeGame) {
            socket.join(activeGame.id);
            socket.emit('game:reconnect', activeGame.getState(userId));
        }

        socket.on('game:create_pve', async ({ userId, playerColor }: { userId: string, playerColor: PlayerColor }, callback) => {
            try {
                const newGame = await gameManager.createPveGame(userId, playerColor);
                socket.join(newGame.id);
                if (callback) callback(newGame.getState(userId));

                if (newGame.turn === newGame.bot?.color) {
                    await handleBotTurn(newGame);
                }
            } catch (error) {
                console.error("Error creating PvE game:", error);
                if (callback) callback({ error: "Failed to create PvE game." });
            }
        });

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
                await handleBotTurn(game);
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