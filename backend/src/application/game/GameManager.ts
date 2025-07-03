// Файл: backend/src/application/game/GameManager.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor } from '../../domain/game/types';

class GameInstance {
    public board: Board;
    public rules: GameRules;
    public turn: PlayerColor = 'WHITE';
    // Теперь players - это массив ID, а playerColors - маппинг ID в цвет
    public players: string[] = [];
    public playerColors: { [userId: string]: PlayerColor } = {};

    constructor() {
        this.board = new Board();
        this.rules = new GameRules(this.board);
    }

    // Новый метод для добавления игрока
    addPlayer(userId: string): boolean {
        if (this.players.length >= 2 || this.players.includes(userId)) {
            return false; // Игра заполнена или игрок уже в ней
        }
        this.players.push(userId);

        // Назначаем цвета по порядку
        if (this.players.length === 1) {
            this.playerColors[userId] = 'WHITE';
        } else if (this.players.length === 2) {
            this.playerColors[userId] = 'BLACK';
        }
        return true;
    }

    // Проверяем, готова ли игра к старту
    isReady(): boolean {
        return this.players.length === 2;
    }
}

class GameManager {
    private games: Map<string, GameInstance> = new Map();

    // Теперь createGame не принимает ID игроков
    createGame(gameId: string): GameInstance {
        const game = new GameInstance();
        this.games.set(gameId, game);
        return game;
    }

    getGame(gameId: string): GameInstance | undefined {
        return this.games.get(gameId);
    }

    // Получаем или создаем игру
    findOrCreateGame(gameId: string): GameInstance {
        let game = this.getGame(gameId);
        if (!game) {
            game = this.createGame(gameId);
        }
        return game;
    }
}

export const gameManager = new GameManager();