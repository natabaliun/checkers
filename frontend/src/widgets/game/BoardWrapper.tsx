// Файл: frontend/src/widgets/game/BoardWrapper.tsx

import React from 'react';
import styles from './BoardWrapper.module.scss';

// Определяем массивы для координат
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface BoardWrapperProps {
    children: React.ReactNode; // Сюда будет передаваться компонент <Board />
}

export const BoardWrapper: React.FC<BoardWrapperProps> = ({ children }) => {
    return (
        <div className={styles.boardWrapper}>
            <div className={`${styles.coords} ${styles.top}`}>{files.map(f => <span key={f}>{f}</span>)}</div>
            <div className={`${styles.coords} ${styles.bottom}`}>{files.map(f => <span key={f}>{f}</span>)}</div>
            <div className={`${styles.coords} ${styles.left}`}>{ranks.map(r => <span key={r}>{r}</span>)}</div>
            <div className={`${styles.coords} ${styles.right}`}>{ranks.map(r => <span key={r}>{r}</span>)}</div>
            <div className={styles.boardContainer}>
                {children}
            </div>
        </div>
    );
};