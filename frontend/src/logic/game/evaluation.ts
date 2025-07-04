// Файл: frontend/src/logic/game/evaluation.ts

import { Board } from './Board';
import { GameRules } from './GameRules';

/**
 * Оценивает позицию с точки зрения белых.
 * Положительное значение - преимущество у белых.
 * Отрицательное значение - преимущество у черных.
 */
export function evaluatePosition(board: Board): number {
    let score = 0;
    const rules = new GameRules(board);

    // 1. Материальное преимущество (самое важное)
    const whiteMaterial = board.pieceCounts.WHITE;
    const blackMaterial = board.pieceCounts.BLACK;
    score += (whiteMaterial - blackMaterial) * 100; // Каждая шашка стоит 100 очков

    // 2. Преимущество в дамках
    let whiteKings = 0;
    let blackKings = 0;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board.getPieceAt({ row: r, col: c });
            if (piece) {
                if (piece.isKing) {
                    if (piece.color === 'WHITE') whiteKings++;
                    else blackKings++;
                }
                // 3. Позиционные бонусы (например, за центральные клетки)
                if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
                    score += (piece.color === 'WHITE' ? 1 : -1);
                }
            }
        }
    }
    score += (whiteKings - blackKings) * 50; // Дамка стоит на 50 очков больше простой шашки

    // 4. Преимущество в мобильности
    const whiteMoves = rules.findPossibleMoves('WHITE').length + rules.findPossibleCaptures('WHITE').length;
    const blackMoves = rules.findPossibleMoves('BLACK').length + rules.findPossibleCaptures('BLACK').length;
    score += (whiteMoves - blackMoves) * 2;

    return score;
}