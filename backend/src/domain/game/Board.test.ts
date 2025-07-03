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
    });

    it('should convert board state to FEN notation', () => {
        const fen = board.toFen();
        expect(fen).toBe('b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1');
    });

    it('should move a piece from one position to another', () => {
        const from = { row: 5, col: 0 };
        const to = { row: 4, col: 1 };
        board.movePiece(from, to);
        expect(board.getPieceAt(from)).toBeNull();
        expect(board.getPieceAt(to)).toBeInstanceOf(Piece);
        expect(board.getPieceAt(to)?.color).toBe('WHITE');
    });

    it('should promote a piece to a king', () => {
        const piece = new Piece('WHITE');
        // Имитируем ход на последнюю линию
        board['grid'][1][0] = null;
        board['grid'][0][1] = piece;
        board.movePiece({ row: 1, col: 2 }, { row: 0, col: 1 }); // Невалидный ход, но для теста промоушена
        expect(board.getPieceAt({ row: 0, col: 1 })?.isKing).toBe(true);
    });
});