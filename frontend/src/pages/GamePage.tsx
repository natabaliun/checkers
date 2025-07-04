// Файл: frontend/src/pages/GamePage.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import { Board } from '../widgets/game/Board';
import { PlayerCard } from '../widgets/game/PlayerCard';
import { MoveHistory } from '../widgets/game/MoveHistory';
import styles from './GamePage.module.scss';
import commonStyles from '../shared/ui/Common.module.scss';
import { resetGameState, setGameState } from '../entities/game/gameSlice';

const usePlayerData = (allKnownUsers: any[], playerId: string | undefined) => {
    return useMemo(() => {
        if (!playerId) return { nickname: '?', profile: { avatarUrl: null } };
        if (playerId === 'bot-player') return { nickname: 'Bot', profile: { avatarUrl: null } };
        return allKnownUsers.find(u => u.id === playerId) || { nickname: 'Opponent', profile: { avatarUrl: null } };
    }, [allKnownUsers, playerId]);
};

export const GamePage = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const user = useAppSelector(state => state.user.user);
    const gameState = useAppSelector(state => state.game);
    const [gameOverMessage, setGameOverMessage] = useState('');

    const allKnownUsers = user ? [user] : [];
    const whitePlayer = usePlayerData(allKnownUsers, gameState.players?.WHITE);
    const blackPlayer = usePlayerData(allKnownUsers, gameState.players?.BLACK);

    // Эффект для подписки на события
    useEffect(() => {
        if (!user) return;
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

        socketService.onGameUpdate(handleStateUpdate);
        socketService.onGameEnded(handleGameEnded);

        return () => {
            socketService.offGameUpdate(handleStateUpdate);
            socketService.offGameEnded(handleGameEnded);
        };
    }, [user, dispatch, gameState.playerColor]);

    // Эффект для входа и выхода из игры
    useEffect(() => {
        if (gameId && user) {
            socketService.joinGame(gameId);
        }
        return () => {
            if (gameId) {
                socketService.leaveGame(gameId);
            }
        };
    }, [gameId, user]);

    if (gameState.id !== gameId) {
        return <div className={styles.gamePage}><h2>Загрузка игры...</h2></div>;
    }

    const handleResign = () => {
        if (gameId) {
            if (window.confirm('Вы уверены, что хотите сдаться?')) {
                socketService.resign(gameId);
            }
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
            {/* --- ВОТ ПРАВИЛЬНАЯ СТРУКТУРА, КОТОРАЯ БЫЛА ПОТЕРЯНА --- */}
            <div className={styles.gameLayout}>
                <div className={styles.historyPanel}>
                    <MoveHistory moves={gameState.moveHistory} />
                </div>

                <div className={styles.mainPanel}>
                    <div className={styles.playersContainer}>
                        <PlayerCard
                            nickname={whitePlayer.nickname}
                            avatarUrl={whitePlayer.profile?.avatarUrl}
                            color="WHITE"
                            isBot={gameState.players?.WHITE === 'bot-player'}
                        />
                        <span className={styles.vs}>vs</span>
                        <PlayerCard
                            nickname={blackPlayer.nickname}
                            avatarUrl={blackPlayer.profile?.avatarUrl}
                            color="BLACK"
                            isBot={gameState.players?.BLACK === 'bot-player'}
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
            </div>
        </div>
    );
};

export default GamePage;