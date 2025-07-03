// Файл: backend/src/application/game/Bot.ts

import { Board } from '../../domain/game/Board';
import { GameRules } from '../../domain/game/GameRules';
import { PlayerColor, Move, Position, CaptureMove } from '../../domain/game/types';
import { Piece } from '../../domain/game/Piece';

function cloneBoard(board: Board): Board {
    const newBoard = new Board();
    const fen = board.toFen();
    newBoard.loadFromFen(fen);
    return newBoard;
}

export class Bot {
    constructor(public readonly color: PlayerColor) {}

    public findBestMove(board: Board, rules: GameRules): Move | null {
        // 1. ПРИОРИТЕТ: ВЗЯТИЕ.
        const possibleCaptures = rules.findPossibleCaptures(this.color);
        if (possibleCaptures.length > 0) {
            let bestCaptureChain: Move[] = [];
            let maxCaptureScore = -1;

            for (const startCapture of possibleCaptures) {
                let currentScore = 0;
                const capturedPieces: Piece[] = [];
                const chain = this.findLongestCaptureChain(startCapture, board, rules, (capturedPiece) => {
                    capturedPieces.push(capturedPiece);
                });

                // Оцениваем всю цепочку
                currentScore = capturedPieces.reduce((acc, piece) => acc + (piece.isKing ? 5 : 1), 0);

                if (currentScore > maxCaptureScore) {
                    maxCaptureScore = currentScore;
                    bestCaptureChain = chain;
                }
            }
            return bestCaptureChain[0];
        }

        // 2. ЕСЛИ ВЗЯТИЙ НЕТ: Анализ обычных ходов.
        const possibleMoves = rules.findPossibleMoves(this.color);
        if (possibleMoves.length === 0) {
            return null;
        }

        const opponentColor = this.color === 'WHITE' ? 'BLACK' : 'WHITE';
        const scoredMoves: { move: Move, score: number }[] = [];

        for (const move of possibleMoves) {
            let score = 0;
            const pieceToMove = board.getPieceAt(move.from);
            if (!pieceToMove) continue;

            // --- Оцениваем каждый ход ---

            // a) Приоритет на проход в дамки
            const promotionRow = this.color === 'WHITE' ? 0 : 7;
            if (!pieceToMove.isKing && move.to.row === promotionRow) {
                score += 100;
            }

            // Симулируем доску ПОСЛЕ нашего хода
            const boardAfterMyMove = cloneBoard(board);
            boardAfterMyMove.movePiece(move.from, move.to);
            const rulesAfterMyMove = new GameRules(boardAfterMyMove);

            // b) Штраф за ход под бой (ставим шашку под удар)
            const opponentCapturesNow = rulesAfterMyMove.findPossibleCaptures(opponentColor);
            const isMovePuttingPieceInDanger = opponentCapturesNow.some(capture =>
                capture.captured.row === move.to.row && capture.captured.col === move.to.col
            );
            if (isMovePuttingPieceInDanger) {
                score -= pieceToMove.isKing ? 200 : 50;
            }

            // --- НОВОЕ ПРАВИЛО ---
            // c) Штраф за "вскрытие" другой шашки (открываем свою шашку под бой)
            const opponentCapturesBeforeMove = rules.findPossibleCaptures(opponentColor);
            const newDangers = opponentCapturesNow.filter(newCapture =>
                !opponentCapturesBeforeMove.some(oldCapture =>
                    oldCapture.from.row === newCapture.from.row && oldCapture.from.col === newCapture.from.col &&
                    oldCapture.to.row === newCapture.to.row && oldCapture.to.col === newCapture.to.col
                )
            );

            if (newDangers.length > 0) {
                for (const danger of newDangers) {
                    const endangeredPiece = board.getPieceAt(danger.captured);
                    if (endangeredPiece) {
                        // Штрафуем за каждую новую шашку, которую мы подставили
                        score -= endangeredPiece.isKing ? 150 : 40;
                    }
                }
            }

            // d) Бонус за ход в центр
            if (move.to.col >= 2 && move.to.col <= 5) {
                score += 1;
            }

            scoredMoves.push({ move, score });
        }

        scoredMoves.sort((a, b) => b.score - a.score);

        const bestScore = scoredMoves[0].score;
        const bestMoves = scoredMoves.filter(m => m.score === bestScore);
        const randomIndex = Math.floor(Math.random() * bestMoves.length);

        return bestMoves[randomIndex].move;
    }

    private findLongestCaptureChain(
        startCapture: CaptureMove,
        board: Board,
        rules: GameRules,
        onCapture: (capturedPiece: Piece) => void
    ): Move[] {
        const capturedPiece = board.getPieceAt(startCapture.captured);
        if (capturedPiece) {
            onCapture(capturedPiece);
        }

        const tempBoard = cloneBoard(board);
        tempBoard.removePieceAt(startCapture.captured);
        tempBoard.movePiece(startCapture.from, startCapture.to);
        const tempRules = new GameRules(tempBoard);

        const nextCaptures = tempRules.getCapturesForPiece(startCapture.to);

        if (nextCaptures.length === 0) {
            return [startCapture];
        }

        let bestSubChain: Move[] = [];
        for (const nextCapture of nextCaptures) {
            const subChain = this.findLongestCaptureChain(nextCapture, tempBoard, tempRules, onCapture);
            if (subChain.length > bestSubChain.length) {
                bestSubChain = subChain;
            }
        }

        return [startCapture, ...bestSubChain];
    }
}