// Файл: frontend/src/pages/GamePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import { Board } from '../widgets/game/Board';
import styles from './GamePage.module.scss';
import { resetGameState, setGameState } from '../entities/game/gameSlice';

export const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const user = useAppSelector(state => state.user.user);
    const gameState = useAppSelector(state => state.game);
    const [gameOverMessage, setGameOverMessage] = useState('');
    const [showPveButton, setShowPveButton] = useState(false);

    // Эффект для подписки на события
    useEffect(() => {
        if (!user) return;
        socketService.connect(user.id);
        const gameSocket = socketService.gameSocket;

        const handleStateUpdate = (data: any) => dispatch(setGameState(data));
        const handleGameEnded = (data: any) => {
            if (!data.result) return;
            let message = 'Game Over. ';
            if (data.result.winner === 'DRAW') message += 'It\'s a draw!';
            else {
                const winnerColor = data.result.winner;
                message += `${winnerColor} wins! Reason: ${data.result.reason}.`;
                if (winnerColor === gameState.playerColor) message += ' (You won!)';
                else message += ' (You lost)';
            }
            setGameOverMessage(message);
        };

        gameSocket?.on('game:state_update', handleStateUpdate);
        gameSocket?.on('game:reconnect', handleStateUpdate);
        gameSocket?.on('game:ended', handleGameEnded);

        return () => {
            gameSocket?.off('game:state_update', handleStateUpdate);
            gameSocket?.off('game:reconnect', handleStateUpdate);
            gameSocket?.off('game:ended', handleGameEnded);
        };
    }, [user, dispatch, gameState.playerColor]);

    // Эффект для входа в игру
    useEffect(() => {
        if (!gameId || !user) {
            navigate('/');
            return;
        }

        const join = () => socketService.joinGame(gameId, user.id, (data) => {
            if (data.error) {
                alert(data.error);
                navigate('/');
            }
        });

        if (socketService.gameSocket?.connected) join();
        else socketService.gameSocket?.once('connect', join);

        return () => {
            dispatch(resetGameState());
        }
    }, [gameId, user, dispatch, navigate]);

    // Эффект для показа кнопки "Играть с ботом"
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState.status === 'WAITING') {
            timer = setTimeout(() => setShowPveButton(true), 10000);
        } else {
            setShowPveButton(false);
        }
        return () => clearTimeout(timer);
    }, [gameState.status]);

    const handlePlayWithBot = () => {
        if (user && gameId) {
            socketService.gameSocket?.emit('game:start_pve', { gameId, userId: user.id });
            setShowPveButton(false);
        }
    };

    if (gameState.id !== gameId) {
        return <div>Loading game...</div>;
    }

    const handleResign = () => {
        if (user && gameId && window.confirm('Are you sure you want to resign?')) {
            socketService.gameSocket?.emit('game:resign', { gameId, userId: user.id });
        }
    };

    return (
        <div className={styles.gamePage}>
            {gameOverMessage && (
                <div className={styles.gameOverPopup}>
                    <h2>{gameOverMessage}</h2>
                    <button onClick={() => navigate('/')}>Back to Lobby</button>
                </div>
            )}
            <div className={styles.status}>
                Game ID: {gameState.id?.substring(0, 8)} | Status: {gameState.status}
            </div>
            <div className={styles.status}>
                Turn: {gameState.turn}
                {gameState.playerColor && ` | You are ${gameState.playerColor}`}
                {gameState.turn === gameState.playerColor && " (Your turn)"}
            </div>
            {gameState.status === 'PLAYING' ?
                <Board /> :
                (gameState.status === 'WAITING' &&
                    <div>
                        <h2>Waiting for opponent to join...</h2>
                        {showPveButton && (
                            <button onClick={handlePlayWithBot} style={{marginTop: '20px'}}>
                                Play with Bot
                            </button>
                        )}
                    </div>
                )
            }
            {gameState.status === 'PLAYING' && (
                <button onClick={handleResign} style={{ marginTop: '20px' }}>
                    Resign
                </button>
            )}
        </div>
    );
};