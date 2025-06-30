// Файл: frontend/src/shared/api/auth.ts

import axios from 'axios';

// Используем переменную окружения, чтобы было гибче
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_URL,
});

// Interceptor для автоматической подстановки токена
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    register: (data: any) => apiClient.post('/auth/register', data),
    login: (data: any) => apiClient.post('/auth/login', data),
    getMe: () => apiClient.get('/users/me'),
    updateProfile: (data: any) => apiClient.put('/users/me', data),
    uploadAvatar: (formData: FormData) => apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};