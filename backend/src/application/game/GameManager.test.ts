// Файл: backend/src/application/game/GameManager.test.ts

import { gameManager } from './GameManager';
import { prisma } from '../../infrastructure/database/prisma';

// Говорим Jest использовать нашу заглушку для Prisma
jest.mock('../../infrastructure/database/prisma');

describe('GameManager', () => {

    // Очищаем моки перед каждым тестом для чистоты эксперимента
    beforeEach(() => {
        (prisma.activeGame.create as jest.Mock).mockClear();
        (prisma.user.update as jest.Mock).mockClear();
        (prisma.activeGame.update as jest.Mock).mockClear();
        (prisma.completedGame.create as jest.Mock).mockClear();
        (prisma.activeGame.delete as jest.Mock).mockClear();
    });

    it('should create a game and save it to the database', async () => {
        const creatorId = 'user-creator';
        const mockGameId = 'mock-game-id';

        // Настраиваем мок, чтобы он возвращал ожидаемый объект
        (prisma.activeGame.create as jest.Mock).mockResolvedValue({
            id: mockGameId,
            playerWhiteId: creatorId,
            playerBlackId: '',
            fen: 'initial_fen'
        });

        const game = await gameManager.createGame(creatorId);

        expect(game).toBeDefined();
        expect(game.id).toBe(mockGameId);
        expect(game.players.WHITE).toBe(creatorId);

        // Проверяем, что методы Prisma были вызваны с правильными аргументами
        expect(prisma.activeGame.create).toHaveBeenCalledTimes(1);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: creatorId },
            data: { activeGameId: mockGameId }
        });
    });

    it('should allow a player to join an existing game', async () => {
        const creatorId = 'user-creator-2';
        const joinerId = 'user-joiner-2';
        const mockGameId = 'mock-game-id-2';

        // Сначала создаем игру в менеджере, чтобы было куда присоединяться
        (prisma.activeGame.create as jest.Mock).mockResolvedValue({ id: mockGameId });
        const game = await gameManager.createGame(creatorId);

        // Присоединяемся
        await gameManager.joinGame(game.id, joinerId);

        expect(game.players.BLACK).toBe(joinerId);
        expect(game.status).toBe('PLAYING');

        // Проверяем вызовы Prisma для присоединившегося игрока
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: joinerId },
            data: { activeGameId: mockGameId }
        });
        expect(prisma.activeGame.update).toHaveBeenCalledWith({
            where: { id: mockGameId },
            data: { playerBlackId: joinerId }
        });
    });

    it('should save a completed game and clean up active game data', async () => {
        const creatorId = 'user-creator-3';
        const joinerId = 'user-joiner-3';
        const mockGameId = 'mock-game-id-3';

        (prisma.activeGame.create as jest.Mock).mockResolvedValue({ id: mockGameId });
        const game = await gameManager.createGame(creatorId);
        await gameManager.joinGame(game.id, joinerId);

        // Имитируем завершение игры
        game.status = 'FINISHED';
        game.result = { winner: 'WHITE', reason: 'NO_PIECES' };

        await gameManager.finishGame(game.id);

        // Проверяем, что была создана запись о завершенной игре
        expect(prisma.completedGame.create).toHaveBeenCalledTimes(1);

        // Проверяем, что активная игра была удалена
        expect(prisma.activeGame.delete).toHaveBeenCalledWith({ where: { id: mockGameId }});

        // Проверяем, что у обоих игроков был сброшен activeGameId
        expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: creatorId }, data: { activeGameId: null }});
        expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: joinerId }, data: { activeGameId: null }});
    });
});