// Файл: frontend/src/shared/api/game.ts

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Используем тот же инстанс axios, что и для auth, чтобы токены подставлялись
const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const gameApi = {
    getHistory: () => apiClient.get('/games/history'),
};