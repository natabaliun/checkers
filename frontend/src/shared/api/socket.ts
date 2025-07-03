// Файл: frontend/src/shared/api/socket.ts

import { io, Socket } from 'socket.io-client';
import { store } from '../../app/store';
import { setGameState, setMyColor } from '../../entities/game/gameSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        this.socket = io(SOCKET_URL);

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('game:state_update', (data) => {
            console.log('SOCKET: Received game state update:', data);
            store.dispatch(setGameState(data));
            // ВСЁ. Логику setMyColor убрали отсюда, она теперь в компоненте.
        });

        this.socket.on('error', (data) => {
            alert(`Server error: ${data.message || data}`);
        });
    }

    joinGame(gameId: string, userId: string) {
        this.socket?.emit('game:join', { gameId, userId });
    }

    sendMove(gameId: string, userId: string, move: any) {
        this.socket?.emit('game:move', { gameId, userId, move });
    }
}

export const socketService = new SocketService();