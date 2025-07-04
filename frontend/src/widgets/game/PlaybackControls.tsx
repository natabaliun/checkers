// Файл: frontend/src/widgets/game/PlaybackControls.tsx

import React from 'react';
import commonStyles from '../../shared/ui/Common.module.scss';
import styles from './PlaybackControls.module.scss';

interface PlaybackControlsProps {
    currentMove: number;
    totalMoves: number;
    onFirst: () => void;
    onPrev: () => void;
    onNext: () => void;
    onLast: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
                                                                      currentMove,
                                                                      totalMoves,
                                                                      onFirst,
                                                                      onPrev,
                                                                      onNext,
                                                                      onLast
                                                                  }) => {
    return (
        <div className={`${commonStyles.card} ${styles.controls}`}>
            <button onClick={onFirst} disabled={currentMove === 0} className={commonStyles.button}>
                {'<<'}
            </button>
            <button onClick={onPrev} disabled={currentMove === 0} className={commonStyles.button}>
                {'<'}
            </button>
            <div className={styles.moveCounter}>
                Ход: <strong>{currentMove}</strong> / {totalMoves}
            </div>
            <button onClick={onNext} disabled={currentMove === totalMoves} className={commonStyles.button}>
                {'>'}
            </button>
            <button onClick={onLast} disabled={currentMove === totalMoves} className={commonStyles.button}>
                {'>>'}
            </button>
        </div>
    );
};