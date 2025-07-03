// Файл: backend/src/domain/game/Board.ts

import { Piece } from './Piece';
import { PlayerColor, Position, FEN } from './types';

export class Board {
    // [row][col]
    private grid: (Piece | null)[][] = [];
    public pieceCounts = { WHITE: 0, BLACK: 0 };

    constructor() {
        this.setupNewGame();
    }

    public getPieceAt(pos: Position): Piece | null {
        if (this.isOutOfBoard(pos)) return null;
        return this.grid[pos.row][pos.col];
    }

    public movePiece(from: Position, to: Position): void {
        const piece = this.getPieceAt(from);
        if (!piece) return;

        this.grid[to.row][to.col] = piece;
        this.grid[from.row][from.col] = null;

        // Check for promotion
        if (!piece.isKing && (to.row === 0 || to.row === 7)) {
            piece.makeKing();
        }
    }

    public removePieceAt(pos: Position): void {
        const piece = this.getPieceAt(pos);
        if(piece) {
            this.pieceCounts[piece.color]--;
            this.grid[pos.row][pos.col] = null;
        }
    }

    public isOutOfBoard(pos: Position): boolean {
        return pos.row < 0 || pos.row > 7 || pos.col < 0 || pos.col > 7;
    }

    // Очень упрощенный FEN для наших нужд. 'w' - белая, 'W' - дамка, 'b' - черная, 'B' - дамка
    public toFen(): FEN {
        let fen = '';
        for (let r = 0; r < 8; r++) {
            let empty = 0;
            for (let c = 0; c < 8; c++) {
                const piece = this.grid[r][c];
                if (!piece) {
                    empty++;
                } else {
                    if (empty > 0) {
                        fen += empty;
                        empty = 0;
                    }
                    let char = piece.color === 'WHITE' ? 'w' : 'b';
                    if (piece.isKing) {
                        char = char.toUpperCase();
                    }
                    fen += char;
                }
            }
            if (empty > 0) {
                fen += empty;
            }
            if (r < 7) {
                fen += '/';
            }
        }
        return fen;
    }

    public setupNewGame(): void {
        this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
        this.pieceCounts = { WHITE: 12, BLACK: 12 };

        // Расстановка черных
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 !== 0) {
                    this.grid[r][c] = new Piece('BLACK');
                }
            }
        }
        // Расстановка белых
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 !== 0) {
                    this.grid[r][c] = new Piece('WHITE');
                }
            }
        }
    }
}