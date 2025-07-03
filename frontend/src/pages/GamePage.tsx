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

    // Этот useEffect отвечает за подписку на события и очистку при выходе.
    useEffect(() => {
        if (!user) return; // Ждем, пока появится пользователь

        // Подключаемся, если еще не подключены
        socketService.connect(user.id);

        const gameSocket = socketService.gameSocket;

        const handleStateUpdate = (data: any) => {
            console.log("HANDLER: Received game state update:", data);
            dispatch(setGameState(data));
        };

        const handleGameEnded = (data: any) => {
            if (!data.result) return;
            let message = 'Game Over. ';
            if (data.result.winner === 'DRAW') {
                message += 'It\'s a draw!';
            } else {
                const winnerColor = data.result.winner;
                message += `${winnerColor} wins! Reason: ${data.result.reason}.`;
                if (winnerColor === gameState.playerColor) {
                    message += ' (You won!)';
                } else {
                    message += ' (You lost)';
                }
            }
            setGameOverMessage(message);
        };

        // Подписываемся
        gameSocket?.on('game:state_update', handleStateUpdate);
        gameSocket?.on('game:reconnect', handleStateUpdate);
        gameSocket?.on('game:ended', handleGameEnded);

        // Функция очистки при размонтировании
        return () => {
            gameSocket?.off('game:state_update', handleStateUpdate);
            gameSocket?.off('game:reconnect', handleStateUpdate);
            gameSocket?.off('game:ended', handleGameEnded);
        };
    }, [user, dispatch, gameState.playerColor]); // Зависимость от playerColor нужна для корректного сообщения о победе/поражении

    // Этот useEffect отвечает только за вход в игру
    useEffect(() => {
        if (!gameId || !user) {
            navigate('/');
            return;
        }

        const gameSocket = socketService.gameSocket;

        const join = () => {
            socketService.joinGame(gameId, user.id, (data) => {
                // Если при присоединении произошла ошибка, возвращаемся в лобби
                if (data.error) {
                    alert(data.error);
                    navigate('/');
                }
            });
        };

        // Если сокет уже подключен, сразу входим в игру
        if (gameSocket?.connected) {
            join();
        } else {
            // Если сокет еще не подключен, ждем события 'connect' и потом входим
            gameSocket?.once('connect', join);
        }

        // При выходе со страницы сбрасываем состояние игры
        return () => {
            dispatch(resetGameState());
        }
    }, [gameId, user, dispatch, navigate]);


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
                (gameState.status === 'WAITING' && <h2>Waiting for opponent to join...</h2>)
            }
            {gameState.status === 'PLAYING' && (
                <button onClick={handleResign} style={{ marginTop: '20px' }}>
                    Resign
                </button>
            )}
        </div>
    );
};