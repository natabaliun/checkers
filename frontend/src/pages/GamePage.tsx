// Файл: frontend/src/pages/GamePage.tsx

import { useEffect } from 'react';
import { socketService } from '../shared/api/socket';
import { useAppSelector, useAppDispatch } from '../shared/hooks/redux';
import { Board } from '../widgets/game/Board';
import styles from './GamePage.module.scss';
import { setMyColor } from '../entities/game/gameSlice';

const GamePage = () => {
    const { user } = useAppSelector(state => state.user);
    const { turn, playerColor, players } = useAppSelector(state => state.game);
    const dispatch = useAppDispatch();

    useEffect(() => {
        socketService.connect();

        if (user) {
            // Просто отправляем свой реальный ID на сервер
            socketService.joinGame('game123', user.id);
        }
        // Этот useEffect должен выполняться только один раз при монтировании
    }, [user]);

    // Новый useEffect для определения цвета игрока
    useEffect(() => {
        // Этот эффект будет срабатывать каждый раз, когда обновляется user или players
        if (user && players && players[user.id]) {
            dispatch(setMyColor({ userId: user.id }));
        }
    }, [user, players, dispatch]);


    if (!user) {
        return <h2>Please log in to play a game.</h2>
    }

    return (
        <div className={styles.gamePage}>
            <div className={styles.status}>
                {
                    !playerColor && "Waiting for opponent..."
                }
                {
                    playerColor && `You are playing as ${playerColor}. Turn: ${turn} ${turn === playerColor ? "(Your turn)" : ""}`
                }
            </div>
            <Board />
        </div>
    );
};

export default GamePage;