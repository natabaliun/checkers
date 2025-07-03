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
        // === УРОВЕНЬ 1: АНАЛИЗ ВЗЯТИЙ (ПРИНЦИП НАИБОЛЬШЕГО УРОНА) ===
        const possibleCaptures = rules.findPossibleCaptures(this.color);
        if (possibleCaptures.length > 0) {
            let bestCaptureChain: Move[] = [];
            let maxCaptureScore = -1;

            for (const startCapture of possibleCaptures) {
                let currentScore = 0;
                const chain = this.findLongestCaptureChain(startCapture, board, rules, (capturedPiece) => {
                    currentScore += capturedPiece.isKing ? 5 : 1; // Очки за срубленную фигуру
                });

                if (currentScore > maxCaptureScore) {
                    maxCaptureScore = currentScore;
                    bestCaptureChain = chain;
                }
            }
            return bestCaptureChain[0];
        }

        // === УРОВЕНЬ 2: АНАЛИЗ ОБЫЧНЫХ ХОДОВ (ЕСЛИ НЕТ ВЗЯТИЙ) ===
        const possibleMoves = rules.findPossibleMoves(this.color);
        if (possibleMoves.length === 0) {
            return null;
        }

        const opponentColor = this.color === 'WHITE' ? 'BLACK' : 'WHITE';
        const scoredMoves: { move: Move, score: number }[] = [];

        // Считаем ходы противника ДО нашего хода для сравнения
        const opponentMovesBefore = rules.findPossibleMoves(opponentColor).length + rules.findPossibleCaptures(opponentColor).length;

        for (const move of possibleMoves) {
            let score = 0;
            const pieceToMove = board.getPieceAt(move.from);
            if (!pieceToMove) continue;

            // --- ОЦЕНИВАЕМ КАЖДЫЙ ХОД ---
            const boardAfterMyMove = cloneBoard(board);
            boardAfterMyMove.movePiece(move.from, move.to);
            const rulesAfterMyMove = new GameRules(boardAfterMyMove);

            // --- Группа 1: Атакующие/Стратегические бонусы ---
            // a) Проход в дамки (высший приоритет)
            const promotionRow = this.color === 'WHITE' ? 0 : 7;
            if (!pieceToMove.isKing && move.to.row === promotionRow) {
                score += 100;
            }

            // b) Атака дамкой (создание угрозы)
            if (pieceToMove.isKing) {
                const newCapturesForKing = rulesAfterMyMove.getCapturesForPiece(move.to);
                if (newCapturesForKing.length > 0) {
                    score += 15;
                }
            }

            // c) Ограничение подвижности противника
            const opponentMovesAfter = rulesAfterMyMove.findPossibleMoves(opponentColor).length + rulesAfterMyMove.findPossibleCaptures(opponentColor).length;
            if (opponentMovesAfter < opponentMovesBefore) {
                score += (opponentMovesBefore - opponentMovesAfter) * 5;
            }

            // --- Группа 2: Защитные/Позиционные бонусы и штрафы ---
            // d) Штраф за ход под бой (Принцип наименьших потерь)
            const opponentCapturesNow = rulesAfterMyMove.findPossibleCaptures(opponentColor);
            const isMovePuttingPieceInDanger = opponentCapturesNow.some(capture =>
                capture.captured.row === move.to.row && capture.captured.col === move.to.col
            );
            if (isMovePuttingPieceInDanger) {
                score -= pieceToMove.isKing ? 200 : 50;
            }

            // e) Штраф за "вскрытие" другой шашки
            const opponentCapturesBefore = rules.findPossibleCaptures(opponentColor);
            const newDangers = opponentCapturesNow.filter(newCapture =>
                !opponentCapturesBefore.some(oldCapture =>
                    oldCapture.from.row === newCapture.from.row && oldCapture.from.col === newCapture.from.col
                )
            );
            if (newDangers.length > 0) {
                for (const danger of newDangers) {
                    // Исключаем опасность для той шашки, которой мы только что походили
                    if (danger.captured.row !== move.to.row || danger.captured.col !== move.to.col) {
                        const endangeredPiece = board.getPieceAt(danger.captured);
                        if (endangeredPiece) {
                            score -= endangeredPiece.isKing ? 150 : 40;
                        }
                    }
                }
            }

            // f) Бонус за построение "стены" на своей стороне
            const defensiveWallRow = this.color === 'WHITE' ? 7 : 0;
            if (move.to.row === defensiveWallRow && !pieceToMove.isKing) {
                score += 3;
            }

            // g) Штраф за уход с "безопасной" задней линии
            if (move.from.row === defensiveWallRow && !pieceToMove.isKing) {
                score -= 5;
            }

            // h) Штраф за "разбивание пары"
            const isPairedBefore = this.isPaired(move.from, board);
            const isPairedAfter = this.isPaired(move.to, boardAfterMyMove);
            if (isPairedBefore && !isPairedAfter) {
                score -= 3;
            }

            // i) Бонус за ход в центр
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

    private isPaired(pos: Position, board: Board): boolean {
        const piece = board.getPieceAt(pos);
        if (!piece) return false;
        // Проверяем две диагональные клетки сзади
        const backRow = pos.row + (piece.color === 'WHITE' ? 1 : -1);
        const pos1 = { row: backRow, col: pos.col - 1 };
        const pos2 = { row: backRow, col: pos.col + 1 };
        const neighbor1 = board.getPieceAt(pos1);
        const neighbor2 = board.getPieceAt(pos2);
        return (neighbor1?.color === piece.color) || (neighbor2?.color === piece.color);
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
            if (subChain.length >= bestSubChain.length) { // >= для выбора более ценной цепочки при равной длине
                bestSubChain = subChain;
            }
        }

        return [startCapture, ...bestSubChain];
    }
}