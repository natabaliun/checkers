// Файл: frontend/src/entities/user/types.ts

export interface User {
    id: string;
    email: string;
    nickname: string;
    role: 'USER' | 'ADMIN';
    activeGameId: string | null;
}

export interface UserProfile {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    country: string | null;
    city: string | null;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    userId: string;
}