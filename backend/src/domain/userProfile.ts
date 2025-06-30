export type UserProfileData = {
    id: string;
    userId: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    country?: string | null;
    city?: string | null;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
};

// Пока что этот класс простой, но он будет расширяться
export class UserProfile {
    // ... свойства
    constructor(public data: UserProfileData) {}

    update(data: Partial<Omit<UserProfileData, 'id' | 'userId'>>) {
        this.data = { ...this.data, ...data };
    }

    toPersistence() {
        return this.data;
    }
}