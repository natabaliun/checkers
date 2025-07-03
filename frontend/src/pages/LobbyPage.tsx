// Файл: frontend/src/pages/LobbyPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';
import commonStyles from '../shared/ui/Common.module.scss';
import styles from './LobbyPage.module.scss';

export const LobbyPage = () => {
    const { user, isSocketConnected } = useAppSelector(state => state.user);
    const [games, setGames] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const handleLobbyUpdate = (gamesList: any[]) => setGames(gamesList);

        socketService.joinLobby(handleLobbyUpdate);

        return () => {
            socketService.leaveLobby(handleLobbyUpdate);
        };
    }, [user]);

    const handleCreateGame = () => {
        socketService.createGame((gameData) => {
            if (gameData && !gameData.error) {
                navigate(`/game/${gameData.id}`);
            } else {
                alert(`Failed to create game: ${gameData?.error || 'Unknown error'}`);
            }
        });
    };

    const handleCreatePveGame = (playerColor: 'WHITE' | 'BLACK') => {
        socketService.createPveGame(playerColor, (gameData) => {
            if (gameData && !gameData.error) {
                navigate(`/game/${gameData.id}`);
            } else {
                alert(`Failed to create PvE game: ${gameData?.error || 'Unknown error'}`);
            }
        });
    };

    const handleJoinGame = (gameId: string) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <div className={styles.lobbyPage}>
            <h1 className={styles.title}>Игровое Лобби</h1>
            <p className={styles.subtitle}>
                Состояние подключения:
                <span className={isSocketConnected ? styles.online : styles.offline}>
                    {isSocketConnected ? ' Онлайн' : ' Подключение...'}
                </span>
            </p>

            <div className={`${commonStyles.card} ${styles.actionsCard}`}>
                <div className={styles.actionSection}>
                    <h4>Играть против компьютера</h4>
                    <div className={styles.buttonGroup}>
                        <button
                            onClick={() => handleCreatePveGame('WHITE')}
                            className={commonStyles.button}
                            disabled={!isSocketConnected}
                        >
                            Играть за белых
                        </button>
                        <button
                            onClick={() => handleCreatePveGame('BLACK')}
                            className={`${commonStyles.button} ${commonStyles.buttonSecondary}`}
                            disabled={!isSocketConnected}
                        >
                            Играть за черных
                        </button>
                    </div>
                </div>
                <div className={styles.actionSection}>
                    <h4>Играть против человека</h4>
                    <button
                        onClick={handleCreateGame}
                        className={commonStyles.button}
                        disabled={!isSocketConnected}
                    >
                        {isSocketConnected ? 'Создать PvP игру' : 'Подключение...'}
                    </button>
                </div>
            </div>

            <div className={styles.gameLists}>
                <div className={commonStyles.card}>
                    <h3>Доступные игры</h3>
                    {games.filter(g => g.status === 'WAITING').length > 0 ? (
                        <ul className={styles.gameList}>
                            {games.filter(g => g.status === 'WAITING').map(game => (
                                <li key={game.id} className={styles.gameItem}>
                                    <span>Игра от <strong>{game.players.WHITE || '...'}</strong></span>
                                    <button
                                        onClick={() => handleJoinGame(game.id)}
                                        className={commonStyles.button}
                                        disabled={!isSocketConnected}
                                    >
                                        Присоединиться
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className={styles.noGames}>Нет доступных игр для присоединения.</p>}
                </div>

                <div className={commonStyles.card}>
                    <h3>Идущие партии (Наблюдать)</h3>
                    {games.filter(g => g.status === 'PLAYING').length > 0 ? (
                        <ul className={styles.gameList}>
                            {games.filter(g => g.status === 'PLAYING').map(game => (
                                <li key={game.id} className={styles.gameItem}>
                                    <span><strong>{game.players.WHITE || '?'}</strong> vs <strong>{game.players.BLACK || '?'}</strong></span>
                                    <button
                                        onClick={() => navigate(`/game/${game.id}`)}
                                        className={`${commonStyles.button} ${commonStyles.buttonSecondary}`}
                                    >
                                        Смотреть
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className={styles.noGames}>Нет идущих партий для наблюдения.</p>}
                </div>
            </div>
        </div>
    );
};