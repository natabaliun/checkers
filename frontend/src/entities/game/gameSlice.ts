// Файл: frontend/src/entities/game/gameSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type PlayerColor = 'WHITE' | 'BLACK';

interface GameState {
    gameId: string | null;
    fen: string;
    turn: PlayerColor;
    players: { [userId: string]: PlayerColor };
    playerColor: PlayerColor | null; // Цвет текущего пользователя
    status: 'idle' | 'playing' | 'finished';
}

const initialState: GameState = {
    gameId: null,
    fen: 'b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1',
    turn: 'WHITE',
    players: {},
    playerColor: null,
    status: 'idle',
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameState(state, action: PayloadAction<Partial<GameState>>) {
            // Создаем новый объект состояния, объединяя старое состояние с новыми данными
            // Это гарантирует, что мы не потеряем поля, которые не пришли с сервера.
            const newState = { ...state, ...action.payload };
            newState.status = 'playing';

            // Redux Toolkit позволяет вернуть новый объект, чтобы полностью заменить состояние
            return newState;
        },
        setMyColor(state, action: PayloadAction<{ userId: string }>) {
            // userId - это теперь реальный ID из БД
            if (state.players && state.players[action.payload.userId]) {
                state.playerColor = state.players[action.payload.userId];
            }
        }
    },
});

export const { setGameState, setMyColor } = gameSlice.actions;
export default gameSlice.reducer;