// Файл: frontend/src/features/auth/ReturnToGame.tsx

import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/hooks/redux';

export const ReturnToGame = () => {
    const { user } = useAppSelector(state => state.user);
    const navigate = useNavigate();

    if (!user || !user.activeGameId) {
        return null;
    }

    const buttonStyle: React.CSSProperties = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        fontSize: '1rem',
        backgroundColor: '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    };

    return (
        <button
            style={buttonStyle}
            onClick={() => navigate(`/game/${user.activeGameId}`)}
        >
            Return to Active Game
        </button>
    );
};