// Файл: frontend/src/pages/AnalysisPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameApi } from '../shared/api/game';
import { Board as BoardLogic } from '../logic/game/Board';
import { Board as BoardComponent } from '../widgets/game/Board';
import { PlaybackControls } from '../widgets/game/PlaybackControls';
import styles from './AnalysisPage.module.scss';
import commonStyles from '../shared/ui/Common.module.scss';

export const AnalysisPage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();

    const [gameData, setGameData] = useState<any>(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Используем useMemo, чтобы не создавать инстанс BoardLogic на каждый рендер
    const boardLogic = useMemo(() => new BoardLogic(), []);

    useEffect(() => {
        if (!gameId) return;

        setIsLoading(true);
        gameApi.getGameDetails(gameId)
            .then(response => {
                const data = response.data;
                // Парсим историю ходов из JSON-строки
                data.moves = JSON.parse(data.moves);
                setGameData(data);
                // Устанавливаем начальную позицию на доске
                boardLogic.setupNewGame();
            })
            .catch(err => {
                console.error("Failed to load game details", err);
                alert("Could not load game analysis.");
                navigate('/');
            })
            .finally(() => setIsLoading(false));
    }, [gameId, navigate, boardLogic]);

    const handleNavigate = (newIndex: number) => {
        if (!gameData || newIndex < 0 || newIndex > gameData.moves.length) {
            return;
        }
        boardLogic.setupNewGame();
        for (let i = 0; i < newIndex; i++) {
            const move = gameData.moves[i];
            // Здесь нужна логика применения хода, которую мы добавим в BoardLogic
            const isCapture = Math.abs(move.from.row - move.to.row) === 2;
            if(isCapture) {
                boardLogic.removePieceAt({
                    row: (move.from.row + move.to.row) / 2,
                    col: (move.from.col + move.to.col) / 2
                });
            }
            boardLogic.movePiece(move.from, move.to);
        }
        setCurrentMoveIndex(newIndex);
    };

    if (isLoading) {
        return <div className={styles.analysisPage}><h2>Загрузка анализа...</h2></div>;
    }

    if (!gameData) {
        return <div className={styles.analysisPage}><h2>Партия не найдена.</h2></div>;
    }

    return (
        <div className={styles.analysisPage}>
            <div className={`${commonStyles.card} ${styles.header}`}>
                <h1>Анализ партии</h1>
                <p>
                    <strong>{gameData.playerWhiteNickname}</strong> (Белые) vs <strong>{gameData.playerBlackNickname}</strong> (Черные)
                </p>
                <p>Результат: {gameData.result}</p>
            </div>

            <BoardComponent fen={boardLogic.toFen()} />

            <PlaybackControls
                currentMove={currentMoveIndex}
                totalMoves={gameData.moves.length}
                onFirst={() => handleNavigate(0)}
                onPrev={() => handleNavigate(currentMoveIndex - 1)}
                onNext={() => handleNavigate(currentMoveIndex + 1)}
                onLast={() => handleNavigate(gameData.moves.length)}
            />
        </div>
    );
};