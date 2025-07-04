// Файл: frontend/src/logic/game/Piece.ts
import { PlayerColor } from './types';

export class Piece {
    constructor(public color: PlayerColor, public isKing: boolean = false) {}

    public makeKing(): void {
        this.isKing = true;
    }
}