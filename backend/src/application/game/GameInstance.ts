// Файл: backend/src/application/game/GameInstance.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor, Position, Move } from '../../domain/game/types';
import { Bot } from './Bot';

export type GameStatus = 'WAITING' | 'PLAYING' | 'FINISHED';
export type GameResult = { winner: PlayerColor | 'DRAW', reason: string };

export class GameInstance {
    public board: Board;
    public rules: GameRules;
    public turn: PlayerColor = 'WHITE';
    public status: GameStatus = 'WAITING';

    public players: { [color in PlayerColor]?: string } = {};
    public playerColors: { [userId: string]: PlayerColor } = {};
    public spectators: string[] = [];
    public moveHistory: Move[] = [];
    public result: GameResult | null = null;
    public startedAt: Date = new Date();

    public isPve: boolean = false;
    public bot: Bot | null = null;

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
            this.startedAt = new Date();
            return 'BLACK';
        }

        if (!this.spectators.includes(playerId)) {
            this.spectators.push(playerId);
        }
        return 'SPECTATOR';
    }

    public addBot(): 'BLACK' | null {
        if (this.status !== 'WAITING' || this.players.BLACK) {
            return null;
        }

        const botId = 'bot-player';
        this.bot = new Bot('BLACK');
        this.isPve = true;

        this.players.BLACK = botId;
        this.playerColors[botId] = 'BLACK';
        this.status = 'PLAYING';
        this.startedAt = new Date();

        return 'BLACK';
    }

    public makeMove(playerId: string, move: Move): boolean {
        const playerColor = this.playerColors[playerId];
        if (this.turn !== playerColor) throw new Error("Not your turn");

        const validationResult = this.rules.isValidMove(move, playerColor);
        if (!validationResult.valid) throw new Error("Invalid move");

        if (validationResult.capture) {
            this.board.removePieceAt(validationResult.capture.captured);
        }

        this.board.movePiece(move.from, move.to);
        this.moveHistory.push(move);

        const pieceAfterMove = this.board.getPieceAt(move.to);
        if (validationResult.capture && pieceAfterMove) {
            const nextCaptures = this.rules.getCapturesForPiece(move.to);
            if (nextCaptures.length > 0) return false;
        }

        this.turn = this.turn === 'WHITE' ? 'BLACK' : 'WHITE';

        const opponentColor = this.turn;

        if (this.board.pieceCounts[opponentColor] === 0) {
            this.status = 'FINISHED';
            this.result = { winner: playerColor, reason: 'NO_PIECES' };
            return true;
        }

        const opponentHasMoves = this.rules.findPossibleCaptures(opponentColor).length > 0 || this.rules.findPossibleMoves(opponentColor).length > 0;
        if (!opponentHasMoves) {
            this.status = 'FINISHED';
            this.result = { winner: playerColor, reason: 'NO_MOVES' };
            return true;
        }

        return false;
    }

    public resign(playerId: string): boolean {
        const playerColor = this.playerColors[playerId];
        if (!playerColor || this.status !== 'PLAYING') return false;

        this.status = 'FINISHED';
        const winner = playerColor === 'WHITE' ? 'BLACK' : 'WHITE';
        this.result = { winner, reason: 'RESIGNATION' };
        return true;
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
            playerColor: getPlayerColor(userId),
            result: this.result,
            // --- НОВОЕ ПОЛЕ ---
            moveHistory: this.moveHistory.map(move => this.moveToStr(move)),
        };
    }

    // Вспомогательный метод для конвертации хода в строку
    private moveToStr(move: Move): string {
        return `${this.posToString(move.from)}-${this.posToString(move.to)}`;
    }

    // Вспомогательный метод для конвертации позиции в строку (e.g., a1, h8)
    private posToString(pos: Position): string {
        const files = 'abcdefgh';
        return `${files[pos.col]}${8 - pos.row}`;
    }
}