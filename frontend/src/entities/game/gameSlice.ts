// Файл: frontend/src/entities/game/gameSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type PlayerColor = 'WHITE' | 'BLACK';
// Добавляем все возможные статусы
type GameStatus = 'IDLE' | 'WAITING' | 'PLAYING' | 'FINISHED';

interface GameState {
    id: string | null;
    fen: string;
    turn: PlayerColor;
    players: { [color in PlayerColor]?: string };
    playerColor: PlayerColor | null;
    status: GameStatus;
}

const initialState: GameState = {
    id: null,
    fen: 'b1b1b1b1/1b1b1b1b/b1b1b1b1/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1',
    turn: 'WHITE',
    players: {},
    playerColor: null,
    status: 'IDLE', // Начальное состояние - IDLE
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        // Устанавливает полное состояние игры
        setGameState(state, action: PayloadAction<any>) {
            // action.payload приходит с сервера. Мы полностью доверяем ему.
            // И просто заменяем наш стейт на то, что пришло.
            const serverState = action.payload;

            // Важно: мы не делаем { ...state, ...serverState },
            // потому что это может оставить "хвосты" от предыдущей игры.
            // Мы полностью заменяем состояние данными с сервера.
            state.id = serverState.id;
            state.fen = serverState.fen;
            state.turn = serverState.turn;
            state.players = serverState.players;
            state.playerColor = serverState.playerColor; // Сервер теперь тоже вычисляет это
            state.status = serverState.status; // Это ключевое обновление!
        },
        // Сброс к начальному состоянию
        resetGameState() {
            // Возвращаем initialState, чтобы очистить все данные об игре
            return initialState;
        }
    },
});

export const { setGameState, resetGameState } = gameSlice.actions;
export default gameSlice.reducer;