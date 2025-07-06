// Файл: frontend/src/pages/AnalysisPage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameApi } from '../shared/api/game';
import { Board as BoardLogic } from '../logic/game/Board';
import { evaluatePosition } from '../logic/game/evaluation';
import { Board as BoardComponent } from '../widgets/game/Board';
import { BoardWrapper } from '../widgets/game/BoardWrapper';
import { PlaybackControls } from '../widgets/game/PlaybackControls';
import { MoveHistory } from '../widgets/game/MoveHistory';
import styles from './AnalysisPage.module.scss';
import commonStyles from '../shared/ui/Common.module.scss';
import { Position } from '../logic/game/types'; // Импортируем тип Position

const posToString = (pos: Position): string => {
    const files = 'abcdefgh';
    return `${files[pos.col]}${8 - pos.row}`;
};
const moveToStr = (move: { from: Position, to: Position }): string => {
    return `${posToString(move.from)}-${posToString(move.to)}`;
};

export const AnalysisPage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();

    const [gameData, setGameData] = useState<any>(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [positionScores, setPositionScores] = useState<number[]>([]);

    const boardLogic = useMemo(() => new BoardLogic(), []);

    useEffect(() => {
        if (!gameId) return;

        setIsLoading(true);
        gameApi.getGameDetails(gameId)
            .then(response => {
                const data = response.data;
                try {
                    data.moves = JSON.parse(data.moves);
                } catch (e) {
                    console.error("Failed to parse moves history:", e);
                    data.moves = [];
                }
                setGameData(data);

                const scores: number[] = [];
                const tempBoard = new BoardLogic();
                scores.push(evaluatePosition(tempBoard));

                for (const move of data.moves) {
                    const isCapture = Math.abs(move.from.row - move.to.row) === 2;
                    if(isCapture) {
                        tempBoard.removePieceAt({
                            row: (move.from.row + move.to.row) / 2,
                            col: (move.from.col + move.to.col) / 2
                        });
                    }
                    tempBoard.movePiece(move.from, move.to);
                    scores.push(evaluatePosition(tempBoard));
                }
                setPositionScores(scores);

                boardLogic.setupNewGame();
            })
            .catch(err => {
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
            const isCapture = Math.abs(move.from.row - move.to.row) === 2;
            if (isCapture) {
                boardLogic.removePieceAt({ row: (move.from.row + move.to.row) / 2, col: (move.from.col + move.to.col) / 2 });
            }
            boardLogic.movePiece(move.from, move.to);
        }
        setCurrentMoveIndex(newIndex);
    };

    if (isLoading) return <div className={styles.analysisPage}><h2>Загрузка анализа...</h2></div>;
    if (!gameData) return <div className={styles.analysisPage}><h2>Партия не найдена.</h2></div>;

    const movesWithScores = gameData.moves.map((moveObj: any, index: number) => {
        const prevScore = positionScores[index] || 0;
        const currentScore = positionScores[index + 1] || 0;
        const scoreDelta = currentScore - prevScore;
        return {
            move: moveToStr(moveObj), // Конвертируем объект хода в строку
            score: currentScore,
            delta: index % 2 === 0 ? scoreDelta : -scoreDelta
        };
    });

    return (
        <div className={styles.analysisPage}>
            <div className={`${commonStyles.card} ${styles.header}`}>
                <h1>Анализ партии</h1>
                <p><strong>{gameData.playerWhiteNickname}</strong> vs <strong>{gameData.playerBlackNickname}</strong></p>
                <p>Результат: {gameData.result}</p>
            </div>

            <div className={styles.gameLayout}>
                <div className={styles.historyPanel}>
                    <MoveHistory
                        moves={movesWithScores}
                        onMoveSelect={handleNavigate}
                        currentMoveIndex={currentMoveIndex}
                        title="Анализ Ходов"
                    />
                </div>
                <div className={styles.mainPanel}>
                    <BoardWrapper>
                        <BoardComponent fen={boardLogic.toFen()} />
                    </BoardWrapper>
                    <PlaybackControls
                        currentMove={currentMoveIndex}
                        totalMoves={gameData.moves.length}
                        onFirst={() => handleNavigate(0)}
                        onPrev={() => handleNavigate(currentMoveIndex - 1)}
                        onNext={() => handleNavigate(currentMoveIndex + 1)}
                        onLast={() => handleNavigate(gameData.moves.length)}
                    />
                </div>
            </div>
        </div>
    );
};