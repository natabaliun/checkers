// Файл: frontend/src/widgets/game/Board.tsx

import { useState } from 'react';
import { useAppSelector } from '../../shared/hooks/redux';
import styles from './Board.module.scss';

type Position = { row: number, col: number };

interface BoardProps {
    fen: string;
    // Делаем обработчик хода опциональным, так как в режиме анализа он не нужен
    onMove?: (move: { from: Position, to: Position }) => void;
}

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

export const Board: React.FC<BoardProps> = ({ fen, onMove }) => {
    // gameState и user больше не нужны напрямую, только playerColor и turn для валидации кликов
    const { turn, playerColor } = useAppSelector(state => state.game);

    const boardState = parseFen(fen);
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

    const handleCellClick = (row: number, col: number) => {
        // Если обработчик onMove не передан (режим анализа), клики не работают
        if (!onMove) return;

        if (playerColor !== turn) {
            return;
        }

        const pieceChar = boardState[row][col];

        if (selectedPiece) {
            const move = { from: selectedPiece, to: { row, col } };
            onMove(move); // Вызываем колбэк, переданный из родителя
            setSelectedPiece(null);
        } else {
            if (pieceChar) {
                const pieceColorOfCell = (pieceChar === 'w' || pieceChar === 'W') ? 'WHITE' : 'BLACK';
                if (pieceColorOfCell === playerColor) {
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