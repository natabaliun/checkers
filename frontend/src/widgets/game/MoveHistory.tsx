// Файл: frontend/src/widgets/game/MoveHistory.tsx

import React, { useEffect, useRef } from 'react';
import styles from './MoveHistory.module.scss';

interface MoveHistoryProps {
    moves: string[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
    const movesEndRef = useRef<null | HTMLDivElement>(null);

    // Функция для автоматической прокрутки вниз при добавлении нового хода
    const scrollToBottom = () => {
        movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [moves]);

    // Группируем ходы по парам (ход белых, ход черных) для удобного отображения
    const pairedMoves: [string, string][] = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairedMoves.push([moves[i], moves[i + 1] || '...']);
    }

    return (
        <div className={styles.moveHistory}>
            <h3 className={styles.title}>Ходы партии</h3>
            <ol className={styles.list}>
                {pairedMoves.map(([whiteMove, blackMove], index) => (
                    <li key={index} className={styles.movePair}>
                        <span className={styles.moveNumber}>{index + 1}.</span>
                        <span className={styles.move}>{whiteMove}</span>
                        <span className={styles.move}>{blackMove}</span>
                    </li>
                ))}
                {/* Пустой div, к которому будет осуществляться прокрутка */}
                <div ref={movesEndRef} />
            </ol>
        </div>
    );
};