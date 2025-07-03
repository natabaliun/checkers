// Файл: frontend/src/shared/api/socket.ts

import { io, Socket } from 'socket.io-client';
import { store } from '../../app/store';
import { resetGameState, setGameState } from '../../entities/game/gameSlice';
import { setSocketConnected } from '../../entities/user/userSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

interface SocketAuth {
    userId: string;
}

// Указываем, что в ServerEvents и ClientEvents могут быть любые события с любыми данными.
// Это отключает строгую проверку типов для .on и .emit, что упрощает жизнь в этом файле.
type GameSocket = Socket<any, any> & { auth: SocketAuth };

class SocketService {
    public lobbySocket: Socket | null = null;
    public gameSocket: GameSocket | null = null;

    public init(userId: string): void {
        if (!userId || this.gameSocket) return;

        this.lobbySocket = io(`${SOCKET_URL}/lobby`);
        this.lobbySocket.on('connect', () => console.log('Lobby socket connected'));

        this.gameSocket = io(`${SOCKET_URL}/game`, {
            auth: { userId },
            autoConnect: false,
        }) as GameSocket;

        this.gameSocket.on('connect', () => {
            console.log(`Game socket connected: ${this.gameSocket?.id}`);
            store.dispatch(setSocketConnected(true));
        });

        this.gameSocket.on('disconnect', () => {
            console.log('Game socket disconnected');
            store.dispatch(setSocketConnected(false));
        });

        // Указываем тип для data, чтобы ESLint не ругался
        this.gameSocket.on('error', (data: any) => alert(`Socket Error: ${data.message || data}`));
    }

    private ensureConnected(socket: Socket | null): void {
        if (socket && !socket.connected) {
            socket.connect();
        }
    }

    public onGameUpdate(handler: (data: any) => void) {
        this.gameSocket?.on('game:state_update', handler);
        this.gameSocket?.on('game:reconnect', handler);
    }
    public offGameUpdate(handler: (data: any) => void) {
        this.gameSocket?.off('game:state_update', handler);
        this.gameSocket?.off('game:reconnect', handler);
    }
    public onGameEnded(handler: (data: any) => void) {
        this.gameSocket?.on('game:ended', handler);
    }
    public offGameEnded(handler: (data: any) => void) {
        this.gameSocket?.off('game:ended', handler);
    }
    public joinLobby(callback: (games: any[]) => void) {
        this.ensureConnected(this.lobbySocket);
        this.lobbySocket?.on('lobby:games_list', callback);
    }
    public leaveLobby(callback: (games: any[]) => void) {
        this.lobbySocket?.off('lobby:games_list', callback);
    }

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Добавляем тип для `data`, чтобы TypeScript был доволен
    private emitSafely(socket: Socket | null, event: string, data: any, callback?: (response: any) => void) {
        if (socket && socket.connected) {
            socket.emit(event, data, callback);
        } else {
            console.error(`Cannot emit event '${event}': socket is not connected.`);
            // alert("Connection is not ready. Please refresh the page or wait a moment.");
        }
    }

    public joinGame(gameId: string): void {
        if (!this.gameSocket) return console.error("Game socket not initialized.");
        this.ensureConnected(this.gameSocket);
        // Для emit'ов без колбэка просто вызываем их
        this.gameSocket.emit('game:join', { gameId, userId: this.gameSocket.auth.userId });
    }

    public leaveGame(gameId: string): void {
        if (this.gameSocket) {
            console.log(`Leaving game ${gameId}`);
        }
        store.dispatch(resetGameState());
    }

    public createGame(callback: (data: any) => void) {
        if (!this.gameSocket?.connected) return alert("Not connected to game server!");
        this.gameSocket.emit('game:create', { userId: this.gameSocket.auth.userId }, callback);
    }

    public createPveGame(playerColor: 'WHITE' | 'BLACK', callback: (data: any) => void) {
        if (!this.gameSocket?.connected) return alert("Not connected to game server!");
        this.gameSocket.emit('game:create_pve', { userId: this.gameSocket.auth.userId, playerColor }, callback);
    }

    public sendMove(gameId: string, move: any) {
        if (!this.gameSocket?.connected) return;
        this.gameSocket.emit('game:move', { gameId, userId: this.gameSocket.auth.userId, move });
    }

    public resign(gameId: string) {
        if(!this.gameSocket?.connected) return;
        this.gameSocket.emit('game:resign', { gameId, userId: this.gameSocket.auth.userId });
    }

    public disconnect() {
        this.lobbySocket?.disconnect();
        this.gameSocket?.disconnect();
        this.lobbySocket = null;
        this.gameSocket = null;
        store.dispatch(setSocketConnected(false));
    }
}

export const socketService = new SocketService();