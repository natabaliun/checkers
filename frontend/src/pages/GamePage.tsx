// Файл: frontend/src/pages/GamePage.tsx

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import { Board } from '../widgets/game/Board';
import styles from './GamePage.module.scss';
// Убираем resetGameState из импорта, чтобы не использовать его
// import { resetGameState } from '../entities/game/gameSlice';

const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const user = useAppSelector(state => state.user.user);
    const gameState = useAppSelector(state => state.game);

    useEffect(() => {
        if (!gameId || !user) {
            navigate('/');
            return;
        }
        socketService.connect(user.id);

        if (gameState.id !== gameId) {
            socketService.joinGame(gameId, user.id, (data) => {
                if (data.error) {
                    alert(data.error);
                    navigate('/');
                }
            });
        }

        // ВРЕМЕННО УБИРАЕМ ОЧИСТКУ, ЧТОБЫ ИСКЛЮЧИТЬ ЕЕ ВЛИЯНИЕ
        // return () => {
        //     dispatch(resetGameState());
        // }
    }, [gameId, user, dispatch, navigate]);


    if (gameState.status === 'IDLE' || gameState.id !== gameId) {
        return <div>Loading game...</div>;
    }

    return (
        <div className={styles.gamePage}>
            {/* ... JSX без изменений ... */}
            <div className={styles.status}>
                Game ID: {gameState.id} | Status: {gameState.status}
            </div>
            <div className={styles.status}>
                Turn: {gameState.turn}
                {gameState.playerColor && ` | You are ${gameState.playerColor}`}
                {gameState.turn === gameState.playerColor && " (Your turn)"}
            </div>
            {gameState.status === 'PLAYING' ?
                <Board /> :
                <h2>Waiting for opponent to join...</h2>
            }
        </div>
    );
};

export default GamePage;