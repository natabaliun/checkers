// Файл: backend/src/application/game/Bot.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor, Move } from '../../domain/game/types';

export class Bot {
    constructor(public readonly color: PlayerColor) {}

    /**
     * Находит лучший ход согласно "жадному" алгоритму.
     * Приоритет:
     * 1. Найти взятие. Если их несколько, выбрать любое (первое попавшееся).
     * 2. Если взятий нет, найти любой обычный ход и выбрать случайный из них.
     */
    public findBestMove(board: Board, rules: GameRules): Move | null {
        // 1. Ищем обязательные взятия
        const possibleCaptures = rules.findPossibleCaptures(this.color);
        if (possibleCaptures.length > 0) {
            // "Жадный" алгоритм: просто берем первое попавшееся взятие.
            const bestCapture = possibleCaptures[0];
            return { from: bestCapture.from, to: bestCapture.to };
        }

        // 2. Если взятий нет, ищем обычные ходы
        const possibleMoves = rules.findPossibleMoves(this.color);
        if (possibleMoves.length > 0) {
            // Выбираем случайный ход, чтобы игра не была слишком предсказуемой
            const randomIndex = Math.floor(Math.random() * possibleMoves.length);
            return possibleMoves[randomIndex];
        }

        // Если ходов нет вообще, возвращаем null (это приведет к завершению игры)
        return null;
    }
}