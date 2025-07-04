// Файл: frontend/src/entities/game/GameHistoryItem.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './GameHistoryItem.module.scss';

// Хелпер для форматирования даты и времени
const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const GameHistoryItem = ({ game }: { game: any }) => {
    const isWin = (game.myColor === 'WHITE' && game.result === 'WHITE_WIN') ||
        (game.myColor === 'BLACK' && game.result === 'BLACK_WIN');
    const resultText = game.result === 'DRAW' ? 'Ничья' : (isWin ? 'Победа' : 'Поражение');
    const resultClass = game.result === 'DRAW' ? styles.draw : (isWin ? styles.win : styles.loss);

    const durationMs = new Date(game.endedAt).getTime() - new Date(game.startedAt).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0).padStart(2, '0');

    return (
        <li className={styles.historyItem}>
            <span className={resultClass}>{resultText}</span>
            <div className={styles.opponentInfo}>
                vs <strong>{game.opponentNickname}</strong>
                <small>(Вы играли за {game.myColor})</small>
            </div>
            <div className={styles.timeInfo}>
                <span className={styles.duration}>Длительность: {minutes}:{seconds}</span>
                <span className={styles.date}>Дата: {formatDateTime(game.endedAt)}</span>
            </div>
            <Link to={`/analysis/${game.id}`} className={styles.analysisLink}>Анализ</Link>
        </li>
    );
};