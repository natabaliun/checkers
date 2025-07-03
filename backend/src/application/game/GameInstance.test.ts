// Файл: backend/src/application/game/GameInstance.test.ts

import { GameInstance } from './GameInstance';
import { GameRules } from '../../domain/game/GameRules';
import { Board } from '../../domain/game/Board';
import { Move, CaptureMove } from '../../domain/game/types';

// Мокаем зависимости, чтобы тестировать GameInstance в изоляции
jest.mock('../../domain/game/GameRules');

// Улучшенный мок для Board: мы предоставляем фабрику,
// которая создает объект с нужными нам свойствами и методами.
jest.mock('../../domain/game/Board', () => {
    return {
        Board: jest.fn().mockImplementation(() => {
            // Этот объект будет нашим "инстансом" мока Board
            return {
                // Добавляем свойство pieceCounts, которое ожидает GameInstance
                pieceCounts: { WHITE: 12, BLACK: 12 },
                // Добавляем моки для методов, которые могут быть вызваны
                movePiece: jest.fn(),
                removePieceAt: jest.fn(),
                // getPieceAt должен что-то возвращать, чтобы pieceAfterMove не был null
                getPieceAt: jest.fn().mockReturnValue({ isKing: false }),
            };
        })
    };
});


describe('GameInstance', () => {
    const player1Id = 'user-white';
    const player2Id = 'user-black';
    let game: GameInstance;

    beforeEach(() => {
        // Сбрасываем моки перед каждым тестом для чистоты эксперимента
        (GameRules as jest.Mock).mockClear();
        (Board as jest.Mock).mockClear();

        game = new GameInstance('game-1', player1Id);
        game.addPlayer(player2Id);

        // Сбрасываем моки инстансов после создания игры
        // (так как конструктор GameInstance вызывает new Board())
        (game.board.movePiece as jest.Mock).mockClear();
        (game.board.removePieceAt as jest.Mock).mockClear();
        (game.board.getPieceAt as jest.Mock).mockClear();
    });

    it('should create a game with one player waiting', () => {
        const newGame = new GameInstance('game-2', player1Id);
        expect(newGame.status).toBe('WAITING');
        expect(newGame.players.WHITE).toBe(player1Id);
        expect(newGame.players.BLACK).toBeUndefined();
        expect(newGame.playerColors[player1Id]).toBe('WHITE');
    });

    it('should add a second player and start the game', () => {
        expect(game.status).toBe('PLAYING');
        expect(game.players.BLACK).toBe(player2Id);
        expect(game.playerColors[player2Id]).toBe('BLACK');
    });

    it('should throw an error if a player tries to move on opponent`s turn', () => {
        const move: Move = { from: { row: 2, col: 1 }, to: { row: 3, col: 2 } };
        expect(() => {
            game.makeMove(player2Id, move); // Черные пытаются ходить первыми
        }).toThrow("Not your turn");
    });

    it('should throw an error for an invalid move according to rules', () => {
        // Настраиваем мок isValidMove, чтобы он всегда возвращал false
        const mockIsValidMove = jest.fn(() => ({ valid: false }));
        game.rules.isValidMove = mockIsValidMove;

        const invalidMove: Move = { from: { row: 0, col: 0 }, to: { row: 1, col: 1 } };

        expect(() => {
            game.makeMove(player1Id, invalidMove);
        }).toThrow("Invalid move");
        expect(mockIsValidMove).toHaveBeenCalledWith(invalidMove, 'WHITE');
    });

    it('should correctly process a valid simple move', () => {
        const mockIsValidMove = jest.fn(() => ({ valid: true }));
        game.rules.isValidMove = mockIsValidMove;
        // Устанавливаем, что у оппонента есть ходы
        game.rules.findPossibleCaptures = jest.fn(() => []);
        game.rules.findPossibleMoves = jest.fn(() => [{from: {row:0, col:0}, to:{row:1, col:1}}]);

        const move: Move = { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } };
        game.makeMove(player1Id, move);

        expect(game.board.movePiece).toHaveBeenCalledWith(move.from, move.to);
        expect(game.turn).toBe('BLACK');
    });

    it('should not change turn if a multi-capture is possible', () => {
        const move: Move = { from: { row: 5, col: 2 }, to: { row: 3, col: 4 } };

        game.rules.isValidMove = jest.fn(() => ({
            valid: true,
            capture: { from: move.from, to: move.to, captured: { row: 4, col: 3 } }
        }));

        const mockNextCapture: CaptureMove = {
            from: { row: 3, col: 4 },
            to: { row: 1, col: 2 },
            captured: { row: 2, col: 3 }
        };
        // Мокаем, что после этого хода есть еще взятия с новой позиции
        game.rules.getCapturesForPiece = jest.fn(() => [mockNextCapture]);

        game.makeMove(player1Id, move);

        expect(game.turn).toBe('WHITE');
        expect(game.board.removePieceAt).toHaveBeenCalled();
    });

    it('should finish the game if no opponent moves are left', () => {
        game.rules.isValidMove = jest.fn(() => ({ valid: true }));
        // Мокаем, что у оппонента (черных) нет ходов
        game.rules.findPossibleCaptures = jest.fn(() => []);
        game.rules.findPossibleMoves = jest.fn(() => []);

        const finalMove: Move = { from: { row: 5, col: 0 }, to: { row: 4, col: 1 } };
        const isFinished = game.makeMove(player1Id, finalMove);

        expect(isFinished).toBe(true);
        expect(game.status).toBe('FINISHED');
        expect(game.result?.winner).toBe('WHITE');
    });
});