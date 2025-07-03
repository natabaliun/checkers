// Файл: backend/src/domain/game/GameRules.test.ts

import { Board } from './Board';
import { GameRules } from './GameRules';
import { Piece } from "./Piece";

describe('GameRules', () => {
    let board: Board;
    let rules: GameRules;

    beforeEach(() => {
        board = new Board();
        rules = new GameRules(board);
    });

    it('should find correct initial moves for WHITE', () => {
        const moves = rules.findPossibleMoves('WHITE');
        // В начале у белых 7 возможных ходов
        expect(moves.length).toBe(7);
        // Проверяем один из ходов
        const sampleMove = moves.find(m => m.from.row === 5 && m.from.col === 0);
        expect(sampleMove?.to).toEqual({ row: 4, col: 1 });
    });

    it('should not allow moves if there is a mandatory capture', () => {
        // Создаем ситуацию для обязательного взятия
        board['grid'][4][3] = new Piece('BLACK'); // Черная шашка
        board.movePiece({ row: 5, col: 2 }, { row: 5, col: 2 }); // Чтобы пересчитать фигуры

        const moves = rules.findPossibleMoves('WHITE');
        const captures = rules.findPossibleCaptures('WHITE');

        expect(moves.length).toBe(0); // Обычных ходов быть не должно
        expect(captures.length).toBe(1);
        expect(captures[0].from).toEqual({ row: 5, col: 2 });
        expect(captures[0].to).toEqual({ row: 3, col: 4 });
    });
});