import { UserProfile } from './userProfile';

export type UserData = {
    id: string;
    email: string;
    nickname: string;
    passwordHash: string;
    role: 'USER' | 'ADMIN';
    activeGameId?: string | null;
    profile?: UserProfile | null;
};

export class User {
    readonly id: string;
    email: string;
    nickname: string;
    passwordHash: string;
    role: 'USER' | 'ADMIN';
    activeGameId?: string | null;
    profile?: UserProfile | null;

    constructor(data: UserData) {
        this.id = data.id;
        this.email = data.email;
        this.nickname = data.nickname;
        this.passwordHash = data.passwordHash;
        this.role = data.role;
        this.activeGameId = data.activeGameId;
        this.profile = data.profile;
    }

    isAdministrator(): boolean {
        return this.role === 'ADMIN';
    }

    assignToGame(gameId: string) {
        this.activeGameId = gameId;
    }

    // Метод для преобразования в формат для Prisma
    toPersistence() {
        return {
            id: this.id,
            email: this.email,
            nickname: this.nickname,
            passwordHash: this.passwordHash,
            role: this.role,
            activeGameId: this.activeGameId,
        };
    }
}