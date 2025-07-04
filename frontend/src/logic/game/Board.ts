// Файл: frontend/src/logic/game/Board.ts

import { Piece } from './Piece';
import { PlayerColor, Position, FEN } from './types';

export class Board {
    // [row][col]
    public grid: (Piece | null)[][] = [];
    public pieceCounts = { WHITE: 0, BLACK: 0 };

    constructor() {
        this.setupNewGame();
    }

    public getPieceAt(pos: Position): Piece | null {
        if (this.isOutOfBoard(pos)) {
            return null;
        }
        return this.grid[pos.row][pos.col];
    }

    public movePiece(from: Position, to: Position): void {
        const piece = this.getPieceAt(from);
        if (!piece) {
            return;
        }

        this.grid[to.row][to.col] = piece;
        this.grid[from.row][from.col] = null;

        const promotionRow = piece.color === 'WHITE' ? 0 : 7;
        if (!piece.isKing && to.row === promotionRow) {
            piece.makeKing();
        }
    }

    public removePieceAt(pos: Position): void {
        const piece = this.getPieceAt(pos);
        if (piece) {
            this.pieceCounts[piece.color]--;
            this.grid[pos.row][pos.col] = null;
        }
    }

    public isOutOfBoard(pos: Position): boolean {
        return pos.row < 0 || pos.row > 7 || pos.col < 0 || pos.col > 7;
    }

    public toFen(): FEN {
        let fen = '';
        for (let r = 0; r < 8; r++) {
            let emptyCells = 0;
            for (let c = 0; c < 8; c++) {
                const piece = this.grid[r][c];
                if (!piece) {
                    emptyCells++;
                } else {
                    if (emptyCells > 0) {
                        fen += emptyCells;
                        emptyCells = 0;
                    }
                    let char = piece.color === 'WHITE' ? 'w' : 'b';
                    if (piece.isKing) {
                        char = char.toUpperCase();
                    }
                    fen += char;
                }
            }
            if (emptyCells > 0) {
                fen += emptyCells;
            }
            if (r < 7) {
                fen += '/';
            }
        }
        return fen;
    }

    public loadFromFen(fen: FEN): void {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.pieceCounts = { WHITE: 0, BLACK: 0 };

        const rows = fen.split('/');
        for (let r = 0; r < rows.length; r++) {
            const rowStr = rows[r];
            let c = 0;
            for (const char of rowStr) {
                if (!isNaN(parseInt(char))) {
                    c += parseInt(char);
                } else {
                    if (c < 8) {
                        const color = (char.toLowerCase() === 'w') ? 'WHITE' : 'BLACK';
                        const isKing = (char === char.toUpperCase());
                        this.grid[r][c] = new Piece(color, isKing);
                        this.pieceCounts[color]++;
                        c++;
                    }
                }
            }
        }
    }

    public setupNewGame(): void {
        const initialFen = '1b1b1b1b/b1b1b1b1/1b1b1b1b/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1';
        this.loadFromFen(initialFen);
    }
}