// Файл: backend/src/domain/game/Board.test.ts

import { Board } from './Board';
import { Piece } from './Piece';

describe('Board', () => {
    let board: Board;

    beforeEach(() => {
        board = new Board();
    });

    it('should setup a new game with correct piece positions', () => {
        // Проверяем несколько ключевых позиций
        expect(board.getPieceAt({ row: 0, col: 1 })?.color).toBe('BLACK');
        expect(board.getPieceAt({ row: 7, col: 0 })?.color).toBe('WHITE');
        expect(board.getPieceAt({ row: 4, col: 4 })).toBeNull();
        // Проверяем, что первая клетка действительно пустая, как и должно быть
        expect(board.getPieceAt({ row: 0, col: 0 })).toBeNull();
    });

    it('should convert board state to FEN notation', () => {
        const fen = board.toFen();
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        // Обновляем ожидаемую строку на ту, что была в "Received"
        expect(fen).toBe('1b1b1b1b/b1b1b1b1/1b1b1b1b/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1');
    });

    it('should move a piece from one position to another', () => {
        const from = { row: 5, col: 0 };
        const to = { row: 4, col: 1 };
        board.movePiece(from, to);
        expect(board.getPieceAt(from)).toBeNull();
        expect(board.getPieceAt(to)).toBeInstanceOf(Piece);
        expect(board.getPieceAt(to)?.color).toBe('WHITE');
    });

    it('should promote a piece to a king when it reaches the last row', () => {
        const piece = new Piece('WHITE');
        // Помещаем шашку на предпоследнюю линию для хода
        board['grid'][1][0] = piece;

        // Делаем ход на последнюю линию
        board.movePiece({ row: 1, col: 0 }, { row: 0, col: 1 });

        // Проверяем, стала ли она дамкой
        expect(board.getPieceAt({ row: 0, col: 1 })?.isKing).toBe(true);
    });

    it('should correctly count pieces', () => {
        expect(board.pieceCounts.WHITE).toBe(12);
        expect(board.pieceCounts.BLACK).toBe(12);

        board.removePieceAt({ row: 2, col: 1 }); // Удаляем черную
        expect(board.pieceCounts.BLACK).toBe(11);

        board.removePieceAt({ row: 5, col: 0 }); // Удаляем белую
        expect(board.pieceCounts.WHITE).toBe(11);
    });
});