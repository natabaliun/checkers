// Файл: backend/src/infrastructure/http/controllers/game.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../../database/prisma';
import { User } from '@prisma/client';

export const gameController = {
    async getHistory(req: Request, res: Response) {
        try {
            const user = req.user as User;
            const userId = user.id;

            const games = await prisma.completedGame.findMany({
                where: { OR: [{ playerWhiteId: userId }, { playerBlackId: userId }] },
                orderBy: { endedAt: 'desc' },
            });

            const opponentIds = new Set<string>();
            games.forEach(game => {
                if (game.playerWhiteId !== userId) opponentIds.add(game.playerWhiteId);
                if (game.playerBlackId !== userId) opponentIds.add(game.playerBlackId);
            });

            const opponents = await prisma.user.findMany({
                where: { id: { in: Array.from(opponentIds) } },
                select: { id: true, nickname: true },
            });
            const opponentMap = new Map(opponents.map(o => [o.id, o.nickname]));

            const history = games.map(game => {
                const myColor = game.playerWhiteId === userId ? 'WHITE' : 'BLACK';
                const opponentId = myColor === 'WHITE' ? game.playerBlackId : game.playerWhiteId;
                const opponentNickname = opponentMap.get(opponentId) || 'Bot';

                return {
                    id: game.id,
                    result: game.result,
                    myColor,
                    opponentNickname,
                    startedAt: game.startedAt,
                    endedAt: game.endedAt
                };
            });

            res.json(history);

        } catch (error) {
            console.error("Error fetching game history:", error);
            res.status(500).json({ message: 'Error fetching game history' });
        }
    },

    // --- НОВЫЙ МЕТОД ---
    async getCompletedGame(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const game = await prisma.completedGame.findUnique({
                where: { id },
            });

            if (!game) {
                return res.status(404).json({ message: 'Game not found' });
            }

            // Получаем никнеймы игроков
            const players = await prisma.user.findMany({
                where: { id: { in: [game.playerWhiteId, game.playerBlackId] } },
                select: { id: true, nickname: true }
            });
            const playerMap = new Map(players.map(p => [p.id, p.nickname]));

            const response = {
                ...game,
                playerWhiteNickname: playerMap.get(game.playerWhiteId) || 'Bot',
                playerBlackNickname: playerMap.get(game.playerBlackId) || 'Bot',
            };

            res.json(response);

        } catch (error) {
            console.error(`Error fetching completed game ${req.params.id}:`, error);
            res.status(500).json({ message: 'Error fetching completed game' });
        }
    }
};