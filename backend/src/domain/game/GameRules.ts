// Файл: backend/src/domain/game/GameRules.ts

import { Board } from './Board';
import { PlayerColor, Position, Move, CaptureMove } from './types';

export class GameRules {
    private board: Board;

    constructor(board: Board) {
        this.board = board;
    }

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

    public findPossibleMoves(playerColor: PlayerColor): Move[] {
        // Если есть взятия, то другие ходы невозможны
        if (this.findPossibleCaptures(playerColor).length > 0) {
            return [];
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

    private getMovesForPiece(pos: Position): Move[] {
        const piece = this.board.getPieceAt(pos);
        if (!piece) return [];

        if (piece.isKing) {
            // Логика для дамки (может ходить на любое расстояние по диагонали)
            return this.getKingMoves(pos);
        } else {
            // Логика для простой шашки
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

    private getCapturesForPiece(pos: Position): CaptureMove[] {
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

    // Упрощенная логика для дамки, для MVP
    private getKingMoves(pos: Position): Move[] { return []; }
    private getKingCaptures(pos: Position): CaptureMove[] { return []; }
}