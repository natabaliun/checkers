// Файл: frontend/src/widgets/game/Board.tsx

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../shared/hooks/redux';
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
    const { fen, turn, playerColor } = useAppSelector(state => state.game);
    const { user } = useAppSelector(state => state.user);
    const boardState = parseFen(fen);

    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

    const handleCellClick = (row: number, col: number) => {
        if (playerColor !== turn) return; // Не наш ход

        const piece = boardState[row][col];

        // Если есть выделенная шашка
        if (selectedPiece) {
            // Это ход
            const move = { from: selectedPiece, to: { row, col } };
            // Отправляем ход на сервер (там будет валидация)
            socketService.sendMove('game123', user!.id, move);
            setSelectedPiece(null);
        } else {
            const piece = boardState[row][col];
            console.log('Clicked piece:', piece);
            console.log('Piece color:', piece && ((piece === 'w' || piece === 'W') ? 'WHITE' : 'BLACK'));
            console.log('My color:', playerColor);

            // Выделяем шашку
            if (piece && ((piece === 'w' || piece === 'W') ? 'WHITE' : 'BLACK') === playerColor) {
                setSelectedPiece({ row, col });
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
                                onClick={() => handleCellClick(r, c)}
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