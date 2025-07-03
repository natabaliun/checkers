// Файл: frontend/src/shared/api/socket.ts

import { io, Socket } from 'socket.io-client';
import { store } from '../../app/store';
import { setGameState } from '../../entities/game/gameSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
    public lobbySocket: Socket | null = null;
    public gameSocket: Socket | null = null;

    connect(userId: string) {
        if (!userId) {
            console.error("SocketService: Cannot connect without userId.");
            return;
        }

        if (!this.lobbySocket || !this.lobbySocket.connected) {
            this.lobbySocket = io(`${SOCKET_URL}/lobby`);
            this.lobbySocket.on('connect', () => console.log('Lobby socket connected:', this.lobbySocket?.id));
        }

        if (!this.gameSocket || !this.gameSocket.connected) {
            this.gameSocket = io(`${SOCKET_URL}/game`, {
                query: { userId },
                reconnection: false
            });
            this.gameSocket.on('connect', () => console.log(`Game socket connected: ${this.gameSocket?.id} for user ${userId}`));
            this.gameSocket.on('error', (data) => alert(`Error: ${data.message || data}`));
        }
    }

    private emitSafely(socket: Socket | null, event: string, data: any, callback?: (response: any) => void) {
        if (socket && socket.connected) {
            socket.emit(event, data, callback);
        } else {
            console.error(`Cannot emit event '${event}': socket is not connected.`);
            alert("Connection is not ready. Please refresh the page or wait a moment.");
        }
    }

    createGame(userId: string, callback: (data: any) => void) {
        this.emitSafely(this.gameSocket, 'game:create', { userId }, callback);
    }

    createPveGame(userId: string, playerColor: 'WHITE' | 'BLACK', callback: (data: any) => void) {
        this.emitSafely(this.gameSocket, 'game:create_pve', { userId, playerColor }, callback);
    }

    joinGame(gameId: string, userId: string, callback: (data: any) => void) {
        this.emitSafely(this.gameSocket, 'game:join', { gameId, userId }, callback);
    }

    sendMove(gameId: string, userId: string, move: any) {
        this.emitSafely(this.gameSocket, 'game:move', { gameId, userId, move });
    }

    onLobbyUpdate(callback: (games: any[]) => void) {
        this.lobbySocket?.on('lobby:games_list', callback);
    }

    offLobbyUpdate() {
        this.lobbySocket?.off('lobby:games_list');
    }

    disconnect() {
        this.lobbySocket?.disconnect();
        this.gameSocket?.disconnect();
        this.lobbySocket = null;
        this.gameSocket = null;
    }
}

export const socketService = new SocketService();