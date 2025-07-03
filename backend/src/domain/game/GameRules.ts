// Файл: backend/src/domain/game/GameRules.ts

import { Board } from './Board';
import { PlayerColor, Position, Move, CaptureMove } from './types';

export class GameRules {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

    /**
     * Находит все возможные взятия для указанного цвета.
     * Это главный метод для определения обязательных ходов.
     */
    public findPossibleCaptures(playerColor: PlayerColor): CaptureMove[] {
        const captures: CaptureMove[] = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board.getPieceAt({ row: r, col: c });
                if (piece && piece.color === playerColor) {
                    captures.push(...this.getCapturesForPiece({ row: r, col: c }));
                }
            }
        }
        return captures;
    }

    /**
     * Находит все возможные обычные ходы (не взятия).
     * Возвращает пустой массив, если есть обязательные взятия.
     */
    public findPossibleMoves(playerColor: PlayerColor): Move[] {
        if (this.findPossibleCaptures(playerColor).length > 0) {
            return []; // Если есть взятие, обычные ходы запрещены
        }

        const moves: Move[] = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board.getPieceAt({ row: r, col: c });
                if (piece && piece.color === playerColor) {
                    moves.push(...this.getMovesForPiece({ row: r, col: c }));
                }
            }
        }
        return moves;
    }

    /**
     * Проверяет, является ли конкретный ход (от from до to) валидным для игрока.
     */
    public isValidMove(move: Move, playerColor: PlayerColor): { valid: boolean, capture?: CaptureMove } {
        const piece = this.board.getPieceAt(move.from);
        if (!piece || piece.color !== playerColor) {
            return { valid: false }; // Нельзя ходить чужой или пустой шашкой
        }

        const possibleCaptures = this.findPossibleCaptures(playerColor);
        if (possibleCaptures.length > 0) {
            // Если есть обязательные взятия, проверяем, является ли ход одним из них
            const capture = possibleCaptures.find(c =>
                this.arePositionsEqual(c.from, move.from) && this.arePositionsEqual(c.to, move.to)
            );
            return { valid: !!capture, capture };
        }

        // Если обязательных взятий нет, проверяем обычные ходы
        const possibleMoves = this.getMovesForPiece(move.from);
        const simpleMove = possibleMoves.find(m =>
            this.arePositionsEqual(m.from, move.from) && this.arePositionsEqual(m.to, move.to)
        );

        return { valid: !!simpleMove };
    }

    private getMovesForPiece(pos: Position): Move[] {
        const piece = this.board.getPieceAt(pos);
        if (!piece) return [];

        if (piece.isKing) {
            return this.getKingMoves(pos);
        } else {
            const dir = piece.color === 'WHITE' ? -1 : 1;
            const moves: Move[] = [];
            const potentialMoves: Position[] = [
                { row: pos.row + dir, col: pos.col - 1 },
                { row: pos.row + dir, col: pos.col + 1 },
            ];
            for (const to of potentialMoves) {
                if (!this.board.isOutOfBoard(to) && !this.board.getPieceAt(to)) {
                    moves.push({ from: pos, to });
                }
            }
            return moves;
        }
    }

    getCapturesForPiece(pos: Position): CaptureMove[] {
        const piece = this.board.getPieceAt(pos);
        if (!piece) return [];

        if (piece.isKing) {
            return this.getKingCaptures(pos);
        } else {
            const captures: CaptureMove[] = [];
            const directions = [{r: -1, c: -1}, {r: -1, c: 1}, {r: 1, c: -1}, {r: 1, c: 1}];
            for (const dir of directions) {
                const opponentPos = { row: pos.row + dir.r, col: pos.col + dir.c };
                const landingPos = { row: pos.row + 2 * dir.r, col: pos.col + 2 * dir.c };

                if (this.board.isOutOfBoard(landingPos)) continue;

                const opponentPiece = this.board.getPieceAt(opponentPos);
                if (opponentPiece && opponentPiece.color !== piece.color && !this.board.getPieceAt(landingPos)) {
                    captures.push({ from: pos, to: landingPos, captured: opponentPos });
                }
            }
            return captures;
        }
    }

    private getKingMoves(pos: Position): Move[] {
        const moves: Move[] = [];
        const directions = [{r: -1, c: -1}, {r: -1, c: 1}, {r: 1, c: -1}, {r: 1, c: 1}];
        for (const dir of directions) {
            let currentPos = { row: pos.row + dir.r, col: pos.col + dir.c };
            while(!this.board.isOutOfBoard(currentPos)) {
                if (this.board.getPieceAt(currentPos)) {
                    break; // Уперлись в фигуру, дальше идти нельзя
                }
                moves.push({ from: pos, to: currentPos });
                currentPos = { row: currentPos.row + dir.r, col: currentPos.col + dir.c };
            }
        }
        return moves;
    }

    private getKingCaptures(pos: Position): CaptureMove[] {
        const captures: CaptureMove[] = [];
        const piece = this.board.getPieceAt(pos);
        if (!piece) return [];

        const directions = [{r: -1, c: -1}, {r: -1, c: 1}, {r: 1, c: -1}, {r: 1, c: 1}];
        for (const dir of directions) {
            let opponentPos: Position | null = null;
            let currentPos = { row: pos.row + dir.r, col: pos.col + dir.c };

            while(!this.board.isOutOfBoard(currentPos)) {
                const currentPiece = this.board.getPieceAt(currentPos);
                if (currentPiece) {
                    // Если это наша фигура - стоп
                    if (currentPiece.color === piece.color) break;
                    // Если это первая вражеская фигура на пути - запоминаем
                    if (!opponentPos) {
                        opponentPos = currentPos;
                    } else {
                        // Если это вторая вражеская фигура - стоп
                        break;
                    }
                } else {
                    // Если мы уже перепрыгнули фигуру, то эта клетка - возможное место для приземления
                    if (opponentPos) {
                        captures.push({ from: pos, to: currentPos, captured: opponentPos });
                    }
                }
                currentPos = { row: currentPos.row + dir.r, col: currentPos.col + dir.c };
            }
        }
        return captures;
    }

    private arePositionsEqual(p1: Position, p2: Position): boolean {
        return p1.row === p2.row && p1.col === p2.col;
    }
}