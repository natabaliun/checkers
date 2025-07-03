// Файл: frontend/src/entities/user/userSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../shared/api/auth';
import { User, UserProfile } from './types';

interface UserState {
    user: (User & { profile: UserProfile }) | null;
    token: string | null;
    isAuthenticated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    isSocketConnected: boolean; // <-- НОВОЕ ПОЛЕ
}

const initialState: UserState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    status: 'idle',
    isSocketConnected: false, // <-- Начальное значение
};

export const checkAuth = createAsyncThunk('user/checkAuth', async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return rejectWithValue('No token found');
    }
    try {
        const response = await authApi.getMe();
        return { user: response.data, token };
    } catch (error: any) {
        localStorage.removeItem('token');
        return rejectWithValue(error.response.data);
    }
});

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        loginSuccess(state, action: PayloadAction<{ token: string; user: any }>) {
            state.isAuthenticated = true;
            state.token = action.payload.token;
            state.user = action.payload.user;
            localStorage.setItem('token', action.payload.token);
        },
        logout(state) {
            state.isAuthenticated = false;
            state.token = null;
            state.user = null;
            state.isSocketConnected = false; // При выходе сбрасываем статус сокета
            localStorage.removeItem('token');
        },
        updateUserProfile(state, action: PayloadAction<UserProfile>) {
            if (state.user) {
                state.user.profile = action.payload;
            }
        },
        updateAvatar(state, action: PayloadAction<string>) {
            if (state.user?.profile) {
                state.user.profile.avatarUrl = action.payload;
            }
        },
        // --- НОВЫЙ РЕДЬЮСЕР ---
        setSocketConnected(state, action: PayloadAction<boolean>) {
            state.isSocketConnected = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkAuth.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.status = 'failed';
                state.isAuthenticated = false;
                state.user = null;
                state.token = null;
            });
    }
});

export const { loginSuccess, logout, updateUserProfile, updateAvatar, setSocketConnected } = userSlice.actions;
export default userSlice.reducer;