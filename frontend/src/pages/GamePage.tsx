// Файл: frontend/src/pages/GamePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import { Board } from '../widgets/game/Board';
import styles from './GamePage.module.scss';
import { resetGameState, setGameState } from '../entities/game/gameSlice';
import commonStyles from '../shared/ui/Common.module.scss';

export const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const user = useAppSelector(state => state.user.user);
    const gameState = useAppSelector(state => state.game);
    const [gameOverMessage, setGameOverMessage] = useState('');

    // --- ЭФФЕКТ №1: ПОДПИСКА НА СОБЫТИЯ WEBSOCKET ---
    // Этот эффект отвечает только за установку и снятие обработчиков.
    useEffect(() => {
        if (!user) return;

        // Подключаемся к сокету
        socketService.connect(user.id);
        const gameSocket = socketService.gameSocket;

        // --- Обработчики ---
        const handleStateUpdate = (data: any) => {
            console.log("HANDLER: Received state update", data);
            dispatch(setGameState(data));
        };

        const handleGameEnded = (data: any) => {
            if (!data.result) return;
            let message = 'Игра окончена. ';
            if (data.result.winner === 'DRAW') {
                message += 'Ничья!';
            } else {
                const winnerColor = data.result.winner;
                message += `Победили ${winnerColor}!`;
                if (winnerColor === gameState.playerColor) {
                    message += ' (Вы победили!)';
                } else {
                    message += ' (Вы проиграли)';
                }
            }
            setGameOverMessage(message);
        };

        // --- Подписка ---
        gameSocket?.on('game:state_update', handleStateUpdate);
        gameSocket?.on('game:reconnect', handleStateUpdate);
        gameSocket?.on('game:ended', handleGameEnded);

        // --- Функция очистки ---
        return () => {
            gameSocket?.off('game:state_update', handleStateUpdate);
            gameSocket?.off('game:reconnect', handleStateUpdate);
            gameSocket?.off('game:ended', handleGameEnded);
        };
    }, [user, dispatch, gameState.playerColor]);


    // --- ЭФФЕКТ №2: ВХОД В ИГРУ ---
    // Этот эффект отвечает только за то, чтобы сказать серверу "я здесь".
    // Он выполняется один раз при заходе на страницу с новым gameId.
    useEffect(() => {
        if (!gameId || !user) {
            navigate('/');
            return;
        }

        const join = () => {
            console.log(`EFFECT: Joining game ${gameId}`);
            socketService.joinGame(gameId, user.id, (data) => {
                if (data.error) {
                    alert(data.error);
                    navigate('/');
                }
                // Мы не диспатчим здесь, а ждем `game:state_update`
            });
        };

        // Если сокет уже подключен, входим сразу.
        if (socketService.gameSocket?.connected) {
            join();
        } else {
            // Если нет, ждем события 'connect' и входим.
            // .once() гарантирует, что обработчик сработает только один раз.
            socketService.gameSocket?.once('connect', join);
        }

        // При выходе со страницы сбрасываем состояние игры.
        return () => {
            dispatch(resetGameState());
        };
    }, [gameId, user, dispatch, navigate]);


    // Условие для отображения загрузки стало проще.
    // Если ID в сторе не совпадает с ID в URL, значит мы ждем первое обновление.
    if (gameState.id !== gameId) {
        return <div className={styles.gamePage}><h2>Загрузка игры...</h2></div>;
    }

    const handleResign = () => {
        if (user && gameId && window.confirm('Вы уверены, что хотите сдаться?')) {
            socketService.gameSocket?.emit('game:resign', { gameId, userId: user.id });
        }
    };

    return (
        <div className={styles.gamePage}>
            {gameOverMessage && (
                <div className={styles.gameOverPopup}>
                    <h2>{gameOverMessage}</h2>
                    <button className={commonStyles.button} onClick={() => navigate('/')}>В лобби</button>
                </div>
            )}
            <div className={styles.header}>
                <div className={styles.status}>
                    Статус: {gameState.status}
                </div>
                <div className={`${styles.status} ${gameState.turn === gameState.playerColor ? styles.myTurn : ''}`}>
                    Ход: {gameState.turn} {gameState.turn === gameState.playerColor && "(Ваш ход)"}
                </div>
            </div>

            <Board />

            <div className={styles.footer}>
                {gameState.playerColor && <p>Вы играете за: <strong>{gameState.playerColor}</strong></p>}
                {gameState.status === 'PLAYING' && (
                    <button onClick={handleResign} className={`${commonStyles.button} ${styles.resignButton}`}>
                        Сдаться
                    </button>
                )}
            </div>
        </div>
    );
};

export default GamePage;