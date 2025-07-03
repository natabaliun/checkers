// Файл: backend/src/domain/game/GameRules.test.ts

import { Board } from './Board';
import { GameRules } from './GameRules';
import { Piece } from './Piece';

describe('GameRules', () => {
    let board: Board;
    let rules: GameRules;

    beforeEach(() => {
        board = new Board();
        rules = new GameRules(board);
    });

    describe('Initial Moves', () => {
        it('should find 7 possible initial moves for WHITE', () => {
            const moves = rules.findPossibleMoves('WHITE');
            expect(moves.length).toBe(7);
        });

        it('should find 7 possible initial moves for BLACK', () => {
            const moves = rules.findPossibleMoves('BLACK');
            expect(moves.length).toBe(7);
        });
    });

    describe('Simple Moves Validation', () => {
        it('should validate a simple forward move', () => {
            const move = { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(true);
        });

        it('should not validate a backward move for a simple piece', () => {
            // Сначала делаем ход вперед, чтобы была возможность ходить назад
            board.movePiece({ row: 5, col: 2 }, { row: 4, col: 3 });
            const move = { from: { row: 4, col: 3 }, to: { row: 5, col: 2 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(false);
        });

        it('should not validate a move to an occupied cell', () => {
            const move = { from: { row: 5, col: 2 }, to: { row: 6, col: 1 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(false);
        });
    });

    describe('Capture Moves Validation', () => {
        it('should identify a mandatory capture for a simple piece', () => {
            // Устанавливаем ситуацию для взятия
            board['grid'][4][3] = new Piece('BLACK');

            const captures = rules.findPossibleCaptures('WHITE');
            expect(captures.length).toBeGreaterThan(0);

            const move = { from: { row: 5, col: 2 }, to: { row: 3, col: 4 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(true);
            expect(result.capture).toBeDefined();
            expect(result.capture?.captured).toEqual({ row: 4, col: 3 });
        });

        it('should invalidate a simple move when a capture is available', () => {
            board['grid'][4][3] = new Piece('BLACK'); // Ситуация для взятия

            // Попытка сделать обычный ход, когда есть взятие
            const move = { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(false);
        });
    });

    describe('King Moves and Captures', () => {
        let king: Piece;

        beforeEach(() => {
            king = new Piece('WHITE', true);
            board['grid'] = Array(8).fill(null).map(() => Array(8).fill(null)); // Очищаем доску
            board['grid'][4][3] = king;
        });

        it('should allow a king to move multiple squares forward diagonally', () => {
            const move = { from: { row: 4, col: 3 }, to: { row: 1, col: 6 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(true);
        });

        it('should allow a king to move multiple squares backward diagonally', () => {
            const move = { from: { row: 4, col: 3 }, to: { row: 6, col: 1 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(true);
        });

        it('should not allow a king to jump over its own piece', () => {
            board['grid'][3][4] = new Piece('WHITE');
            const move = { from: { row: 4, col: 3 }, to: { row: 2, col: 5 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(false);
        });

        it('should allow a king to capture by jumping over an opponent', () => {
            board['grid'][3][4] = new Piece('BLACK');
            const move = { from: { row: 4, col: 3 }, to: { row: 2, col: 5 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(true);
            expect(result.capture?.captured).toEqual({ row: 3, col: 4 });
        });

        it('should not allow king to land on an occupied cell during capture', () => {
            board['grid'][3][4] = new Piece('BLACK');
            board['grid'][2][5] = new Piece('WHITE');
            const move = { from: { row: 4, col: 3 }, to: { row: 2, col: 5 } };
            const result = rules.isValidMove(move, 'WHITE');
            expect(result.valid).toBe(false);
        });
    });
});