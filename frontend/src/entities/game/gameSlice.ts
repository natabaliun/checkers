// Файл: frontend/src/entities/game/gameSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type PlayerColor = 'WHITE' | 'BLACK';
type GameStatus = 'IDLE' | 'WAITING' | 'PLAYING' | 'FINISHED';

interface GameState {
    id: string | null;
    fen: string;
    turn: PlayerColor;
    players: { [color in PlayerColor]?: string };
    playerColor: PlayerColor | null;
    status: GameStatus;
    moveHistory: string[]; // <-- Новое поле
    result: any | null;
}

const initialState: GameState = {
    id: null,
    fen: '1b1b1b1b/b1b1b1b1/1b1b1b1b/8/8/w1w1w1w1/1w1w1w1w/w1w1w1w1',
    turn: 'WHITE',
    players: {},
    playerColor: null,
    status: 'IDLE',
    moveHistory: [], // <-- Начальное значение
    result: null,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameState(state, action: PayloadAction<Partial<GameState>>) {
            const serverState = action.payload;
            state.id = serverState.id ?? state.id;
            state.fen = serverState.fen ?? state.fen;
            state.turn = serverState.turn ?? state.turn;
            state.players = serverState.players ?? state.players;
            state.playerColor = serverState.playerColor ?? state.playerColor;
            state.status = serverState.status ?? state.status;
            state.moveHistory = serverState.moveHistory ?? state.moveHistory;
            state.result = serverState.result ?? state.result;
        },
        resetGameState: () => initialState,
    },
});

export const { setGameState, resetGameState } = gameSlice.actions;
export default gameSlice.reducer;