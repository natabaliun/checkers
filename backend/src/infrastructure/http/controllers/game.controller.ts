// Файл: backend/src/infrastructure/http/controllers/game.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../../database/prisma';

export const gameController = {
    async getHistory(req: Request, res: Response) {
        try {
            const userId = (req.user as any).id;

            const games = await prisma.completedGame.findMany({
                where: {
                    OR: [
                        { playerWhiteId: userId },
                        { playerBlackId: userId },
                    ],
                },
                orderBy: {
                    endedAt: 'desc',
                },
            });

            // Собираем ID всех оппонентов
            const opponentIds = new Set<string>();
            games.forEach(game => {
                if (game.playerWhiteId !== userId) opponentIds.add(game.playerWhiteId);
                if (game.playerBlackId !== userId) opponentIds.add(game.playerBlackId);
            });

            // Получаем никнеймы оппонентов
            const opponents = await prisma.user.findMany({
                where: { id: { in: Array.from(opponentIds) } },
                select: { id: true, nickname: true },
            });
            const opponentMap = new Map(opponents.map(o => [o.id, o.nickname]));

            // Обогащаем данные для клиента
            const history = games.map(game => {
                const myColor = game.playerWhiteId === userId ? 'WHITE' : 'BLACK';
                const opponentId = myColor === 'WHITE' ? game.playerBlackId : game.playerWhiteId;
                const opponentNickname = opponentMap.get(opponentId) || 'Unknown Player';

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
            res.status(500).json({ message: 'Error fetching game history', error });
        }
    },
};