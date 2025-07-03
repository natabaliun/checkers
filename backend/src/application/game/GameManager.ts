// Файл: backend/src/application/game/GameManager.ts

import { Board } from '../../domain/game/Board';
import { prisma } from '../../infrastructure/database/prisma';
import { GameInstance } from './GameInstance'; // <-- ИМПОРТИРУЕМ КЛАСС

class GameManager {
    private games: Map<string, GameInstance> = new Map();
    private userGameMap: Map<string, string> = new Map();

    async createGame(creatorId: string): Promise<GameInstance> {
        const activeGameRecord = await prisma.activeGame.create({
            data: {
                playerWhiteId: creatorId,
                playerBlackId: '',
                fen: new Board().toFen(),
            }
        });

        const game = new GameInstance(activeGameRecord.id, creatorId);
        this.games.set(game.id, game);
        this.userGameMap.set(creatorId, game.id);

        await prisma.user.update({ where: { id: creatorId }, data: { activeGameId: game.id }});

        return game;
    }

    async joinGame(gameId: string, playerId: string): Promise<GameInstance | null> {
        const game = this.games.get(gameId);
        if (!game) return null;

        const role = game.addPlayer(playerId);

        if (role === 'BLACK') {
            this.userGameMap.set(playerId, gameId);
            await prisma.user.update({ where: { id: playerId }, data: { activeGameId: game.id }});
            await prisma.activeGame.update({ where: { id: gameId }, data: { playerBlackId: playerId }});
        }

        return game;
    }

    public getGame(gameId: string): GameInstance | undefined {
        return this.games.get(gameId);
    }

    public getGameByUserId(userId: string): GameInstance | undefined {
        const gameId = this.userGameMap.get(userId);
        return gameId ? this.getGame(gameId) : undefined;
    }

    public async getLobbyGames() {
        const playerIds = new Set<string>();
        this.games.forEach(game => {
            if (game.players.WHITE) playerIds.add(game.players.WHITE);
            if (game.players.BLACK) playerIds.add(game.players.BLACK);
        });

        if (playerIds.size === 0) {
            return [];
        }

        const users = await prisma.user.findMany({
            where: { id: { in: Array.from(playerIds) } },
            select: { id: true, nickname: true },
        });

        const userIdToNickname = new Map<string, string>();
        users.forEach(user => userIdToNickname.set(user.id, user.nickname));

        return Array.from(this.games.values()).map(game => ({
            id: game.id,
            status: game.status,
            players: {
                WHITE: userIdToNickname.get(game.players.WHITE || ''),
                BLACK: userIdToNickname.get(game.players.BLACK || ''),
            },
        }));
    }

    public async finishGame(gameId: string) {
        const game = this.games.get(gameId);
        if (!game) return;

        if (game.players.WHITE) {
            this.userGameMap.delete(game.players.WHITE);
            await prisma.user.update({ where: { id: game.players.WHITE }, data: { activeGameId: null }});
        }
        if (game.players.BLACK) {
            this.userGameMap.delete(game.players.BLACK);
            await prisma.user.update({ where: { id: game.players.BLACK }, data: { activeGameId: null }});
        }

        this.games.delete(gameId);
        await prisma.activeGame.delete({ where: { id: gameId }});
    }
}

export const gameManager = new GameManager();