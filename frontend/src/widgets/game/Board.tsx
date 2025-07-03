// Файл: frontend/src/widgets/game/Board.tsx

import { useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux';
import { socketService } from '../../shared/api/socket';
import styles from './Board.module.scss';

type Position = { row: number, col: number };

const parseFen = (fen: string): (string | null)[][] => {
    const board: (string | null)[][] = [];
    const rows = fen.split('/');
    rows.forEach(rowStr => {
        const row: (string | null)[] = [];
        for (const char of rowStr) {
            if (isNaN(parseInt(char))) {
                row.push(char);
            } else {
                for (let i = 0; i < parseInt(char); i++) {
                    row.push(null);
                }
            }
        }
        board.push(row);
    });
    return board;
};

export const Board = () => {
    const gameState = useAppSelector(state => state.game);
    const { fen, turn, playerColor } = gameState;
    const { user } = useAppSelector(state => state.user);
    const boardState = parseFen(fen);

    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

    const handleCellClick = (row: number, col: number) => {
        // 1. Проверяем, наш ли сейчас ход
        if (playerColor !== turn) {
            console.log(`Cannot move. My color: ${playerColor}, Turn: ${turn}`);
            return;
        }

        const pieceChar = boardState[row][col];

        // 2. Если уже есть выделенная шашка, пытаемся сделать ход
        if (selectedPiece) {
            const move = { from: selectedPiece, to: { row, col } };

            // Убеждаемся, что у нас есть все данные для отправки хода
            if (user && gameState.id) {
                socketService.sendMove(gameState.id, user.id, move);
            }

            // Сбрасываем выделение после попытки хода
            setSelectedPiece(null);
        } else {
            // 3. Если выделенной шашки нет, пытаемся выделить новую
            if (pieceChar) {
                const pieceColor = (pieceChar === 'w' || pieceChar === 'W') ? 'WHITE' : 'BLACK';
                // Выделяем, только если это наша шашка
                if (pieceColor === playerColor) {
                    setSelectedPiece({ row, col });
                }
            }
        }
    };

    return (
        <div className={styles.board}>
            {boardState.map((row, r) =>
                row.map((cell, c) => {
                    const isSelected = selectedPiece && selectedPiece.row === r && selectedPiece.col === c;
                    return (
                        <div
                            key={`${r}-${c}`}
                            className={`${styles.cell} ${(r + c) % 2 === 0 ? styles.light : styles.dark} ${isSelected ? styles.selected : ''}`}
                            onClick={() => handleCellClick(r, c)}
                        >
                            {cell && (
                                <div
                                    className={`${styles.piece} ${(cell === 'w' || cell === 'W') ? styles.white : styles.black} ${isSelected ? styles.selected : ''}`}
                                >
                                    {(cell === 'W' || cell === 'B') && 'K'}
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};