// Файл: backend/src/application/game/GameInstance.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor, Position } from '../../domain/game/types';

export type GameStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export class GameInstance {
    public board: Board;
    public rules: GameRules;
    public turn: PlayerColor = 'WHITE';
    public status: GameStatus = 'WAITING';

    // Объект с цветами и ID игроков
    public players: { [color in PlayerColor]?: string } = {};
    // Объект для быстрого поиска цвета по ID игрока
    public playerColors: { [userId: string]: PlayerColor } = {};

    public spectators: string[] = [];

    constructor(public id: string, creatorId: string) {
        this.board = new Board();
        this.rules = new GameRules(this.board);
        this.players.WHITE = creatorId;
        this.playerColors[creatorId] = 'WHITE';
    }

    public addPlayer(playerId: string) {
        if (this.players.WHITE === playerId || this.players.BLACK === playerId) {
            return 'PLAYER_ALREADY_IN_GAME';
        }

        if (!this.players.BLACK) {
            this.players.BLACK = playerId;
            this.playerColors[playerId] = 'BLACK';
            this.status = 'PLAYING';
            return 'BLACK';
        }

        if (!this.spectators.includes(playerId)) {
            this.spectators.push(playerId);
        }
        return 'SPECTATOR';
    }

    public makeMove(from: Position, to: Position) {
        const isCapture = Math.abs(from.row - to.row) === 2;
        if (isCapture) {
            this.board.removePieceAt({
                row: (from.row + to.row) / 2,
                col: (from.col + to.col) / 2
            });
        }
        this.board.movePiece(from, to);
        this.turn = this.turn === 'WHITE' ? 'BLACK' : 'WHITE';
    }

    public getState(userId?: string) {
        const getPlayerColor = (id?: string) => {
            return id ? this.playerColors[id] || null : null;
        }

        return {
            id: this.id,
            fen: this.board.toFen(),
            turn: this.turn,
            status: this.status,
            players: this.players,
            playerColor: getPlayerColor(userId)
        };
    }
}