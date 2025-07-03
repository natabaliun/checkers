// Файл: frontend/src/widgets/game/PlayerCard.tsx

import React from 'react';
import styles from './PlayerCard.module.scss';

// Импортируем все аватары
import DefaultAvatar from '../../shared/assets/default_avatar.svg';
import BotWhiteAvatar from '../../shared/assets/bot_white_avatar.svg';
import BotBlackAvatar from '../../shared/assets/bot_black_avatar.svg';

interface PlayerCardProps {
    nickname: string | null | undefined;
    avatarUrl: string | null | undefined;
    color: 'WHITE' | 'BLACK';
    isBot: boolean;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const PlayerCard: React.FC<PlayerCardProps> = ({ nickname, avatarUrl, color, isBot }) => {

    const getAvatarSrc = () => {
        if (isBot) {
            return color === 'WHITE' ? BotWhiteAvatar : BotBlackAvatar;
        }
        if (avatarUrl) {
            return `${API_BASE_URL}${avatarUrl}`;
        }
        return DefaultAvatar;
    };

    return (
        <div className={styles.playerCard}>
            <img src={getAvatarSrc()} alt="player avatar" className={styles.avatar} />
            <span className={styles.nickname}>{nickname || '...'}</span>
        </div>
    );
};