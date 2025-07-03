// Файл: frontend/src/pages/GamePage.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import { Board } from '../widgets/game/Board';
import { PlayerCard } from '../widgets/game/PlayerCard'; // Импортируем PlayerCard
import styles from './GamePage.module.scss';
import { resetGameState, setGameState } from '../entities/game/gameSlice';
import commonStyles from '../shared/ui/Common.module.scss';

// Хелпер-хук для получения данных игрока.
// В будущем его можно будет улучшить, чтобы он делал запрос к API за данными оппонента.
const usePlayerData = (allKnownUsers: any[], playerId: string | undefined) => {
    return useMemo(() => {
        if (!playerId) return { nickname: '?', profile: { avatarUrl: null } };
        if (playerId === 'bot-player') return { nickname: 'Bot', profile: { avatarUrl: null } };

        return allKnownUsers.find(u => u.id === playerId) || { nickname: 'Unknown Player', profile: { avatarUrl: null } };
    }, [allKnownUsers, playerId]);
};


export const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const user = useAppSelector(state => state.user.user);
    const gameState = useAppSelector(state => state.game);
    const [gameOverMessage, setGameOverMessage] = useState('');

    // На данный момент, мы знаем информацию только о текущем пользователе.
    const allKnownUsers = user ? [user] : [];

    const whitePlayerId = gameState.players?.WHITE;
    const blackPlayerId = gameState.players?.BLACK;

    const whitePlayer = usePlayerData(allKnownUsers, whitePlayerId);
    const blackPlayer = usePlayerData(allKnownUsers, blackPlayerId);

    // Эффект для подписки на события WebSocket
    useEffect(() => {
        if (!user) return;

        socketService.connect(user.id);
        const gameSocket = socketService.gameSocket;

        const handleStateUpdate = (data: any) => dispatch(setGameState(data));
        const handleGameEnded = (data: any) => {
            if (!data.result) return;
            let message = 'Игра окончена. ';
            if (data.result.winner === 'DRAW') message += 'Ничья!';
            else {
                const winnerColor = data.result.winner;
                message += `Победили ${winnerColor}!`;
                if (winnerColor === gameState.playerColor) message += ' (Вы победили!)';
                else message += ' (Вы проиграли)';
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

        const join = () => {
            socketService.joinGame(gameId, user.id, (data) => {
                if (data.error) {
                    alert(data.error);
                    navigate('/');
                }
            });
        };

        if (socketService.gameSocket?.connected) {
            join();
        } else {
            socketService.gameSocket?.once('connect', join);
        }

        return () => {
            dispatch(resetGameState());
        };
    }, [gameId, user, dispatch, navigate]);


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

            <div className={styles.playersContainer}>
                <PlayerCard
                    nickname={whitePlayer.nickname}
                    avatarUrl={whitePlayer.profile?.avatarUrl}
                    color="WHITE"
                    isBot={whitePlayerId === 'bot-player'}
                />
                <span className={styles.vs}>vs</span>
                <PlayerCard
                    nickname={blackPlayer.nickname}
                    avatarUrl={blackPlayer.profile?.avatarUrl}
                    color="BLACK"
                    isBot={blackPlayerId === 'bot-player'}
                />
            </div>

            <div className={`${styles.status} ${gameState.turn === gameState.playerColor ? styles.myTurn : ''}`}>
                Ход: {gameState.turn} {gameState.turn === gameState.playerColor && "(Ваш ход)"}
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