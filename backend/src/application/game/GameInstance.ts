// Файл: backend/src/application/game/GameInstance.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor, Position, Move } from '../../domain/game/types';

export type GameStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export class GameInstance {
    public board: Board;
    public rules: GameRules;
    public turn: PlayerColor = 'WHITE';
    public status: GameStatus = 'WAITING';

    public players: { [color in PlayerColor]?: string } = {};
    public playerColors: { [userId: string]: PlayerColor } = {};
    public spectators: string[] = [];
    private moveHistory: Move[] = [];

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

    /**
     * Основной метод для выполнения хода с полной проверкой правил.
     * Выбрасывает ошибку, если ход невалидный.
     */
    public makeMove(playerId: string, move: Move): void {
        const playerColor = this.playerColors[playerId];
        if (this.turn !== playerColor) {
            throw new Error("Not your turn");
        }

        const validationResult = this.rules.isValidMove(move, playerColor);
        if (!validationResult.valid) {
            throw new Error("Invalid move");
        }

        // Если это взятие, удаляем срубленную шашку
        if (validationResult.capture) {
            this.board.removePieceAt(validationResult.capture.captured);
        }

        this.board.movePiece(move.from, move.to);
        this.moveHistory.push(move);

        // Проверяем, может ли та же шашка совершить еще одно взятие
        const pieceAfterMove = this.board.getPieceAt(move.to);
        if (validationResult.capture && pieceAfterMove) {
            // Ищем новые взятия только с той клетки, куда мы только что походили
            const nextCaptures = this.rules.getCapturesForPiece(move.to);

            // Если есть еще взятия для этой же шашки, ход не передается
            if (nextCaptures.length > 0) {
                return; // Ход остается у того же игрока
            }
        }

        // Передаем ход другому игроку
        this.turn = this.turn === 'WHITE' ? 'BLACK' : 'WHITE';

        // TODO: Проверка на конец игры (нет шашек или нет ходов)
        const opponentColor = this.turn;
        const opponentHasMoves = this.rules.findPossibleCaptures(opponentColor).length > 0 || this.rules.findPossibleMoves(opponentColor).length > 0;
        if (!opponentHasMoves || this.board.pieceCounts[opponentColor] === 0) {
            this.status = 'FINISHED';
            // TODO: определить победителя
        }
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