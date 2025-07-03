// Файл: frontend/src/pages/LobbyPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../shared/hooks/redux';
import { socketService } from '../shared/api/socket';

export const LobbyPage = () => {
    const { user } = useAppSelector(state => state.user);
    const [games, setGames] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        socketService.connect(user.id);

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleLobbyUpdate = (gamesList: any[]) => setGames(gamesList);

        const gameSocket = socketService.gameSocket;
        const lobbySocket = socketService.lobbySocket;

        gameSocket?.on('connect', handleConnect);
        gameSocket?.on('disconnect', handleDisconnect);
        lobbySocket?.on('lobby:games_list', handleLobbyUpdate);

        if (gameSocket?.connected) {
            handleConnect();
        }

        return () => {
            gameSocket?.off('connect', handleConnect);
            gameSocket?.off('disconnect', handleDisconnect);
            lobbySocket?.off('lobby:games_list', handleLobbyUpdate);
        };
    }, [user]);

    const handleCreateGame = () => {
        if (!user || !isConnected) return;

        // Отправляем событие и в колбэке ТОЛЬКО переходим по URL.
        // Состояние игры будет запрошено на самой странице игры.
        socketService.createGame(user.id, (gameData) => {
            if (gameData && !gameData.error) {
                navigate(`/game/${gameData.id}`);
            } else {
                alert(`Failed to create game: ${gameData?.error || 'Unknown error'}`);
            }
        });
    };

    const handleJoinGame = (gameId: string) => {
        if (!user || !isConnected) return;

        // Просто переходим на страницу игры.
        // GamePage сам отправит событие 'game:join', чтобы получить свое состояние.
        navigate(`/game/${gameId}`);
    };

    const buttonStyle: React.CSSProperties = {
        padding: '8px 12px',
        fontSize: '14px',
        cursor: 'pointer',
        margin: '0 10px',
        border: '1px solid #ccc',
        borderRadius: '4px'
    };
    const disabledButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        cursor: 'not-allowed',
        backgroundColor: '#e0e0e0',
        color: '#999'
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Lobby (Connection: {isConnected ? 'Online' : 'Connecting...'})</h2>
            <button
                onClick={handleCreateGame}
                style={isConnected ? buttonStyle : disabledButtonStyle}
                disabled={!isConnected}
            >
                {isConnected ? 'Create New Game' : 'Connecting...'}
            </button>

            <hr style={{ margin: '20px 0' }}/>

            <h3>Available Games to Join:</h3>
            {games.filter(g => g.status === 'WAITING').length > 0 ? (
                <ul>
                    {games.filter(g => g.status === 'WAITING').map(game => (
                        <li key={game.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                            <span>Game by <strong>{game.players.WHITE || '...'}</strong></span>
                            <button
                                onClick={() => handleJoinGame(game.id)}
                                style={isConnected ? buttonStyle : disabledButtonStyle}
                                disabled={!isConnected}
                            >
                                Join
                            </button>
                        </li>
                    ))}
                </ul>
            ) : <p>No available games to join.</p>}


            <hr style={{ margin: '20px 0' }}/>

            <h3>Ongoing Games (Spectate):</h3>
            {games.filter(g => g.status === 'PLAYING').length > 0 ? (
                <ul>
                    {games.filter(g => g.status === 'PLAYING').map(game => (
                        <li key={game.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                            <span><strong>{game.players.WHITE || '?'}</strong> vs <strong>{game.players.BLACK || '?'}</strong></span>
                            <button
                                onClick={() => navigate(`/game/${game.id}`)}
                                style={buttonStyle}
                            >
                                Spectate
                            </button>
                        </li>
                    ))}
                </ul>
            ) : <p>No ongoing games to watch.</p>}
        </div>
    );
};