// Файл: frontend/src/widgets/game/MoveHistory.tsx

import React, { useEffect, useRef } from 'react';
import styles from './MoveHistory.module.scss';

// Тип для хода с оценкой (используется на странице анализа)
interface MoveWithScore {
    move: string;
    score: number;
    delta: number;
}

// Пропсы теперь могут принимать либо массив строк, либо массив объектов
interface MoveHistoryProps {
    moves: (string | MoveWithScore)[];
    onMoveSelect?: (moveIndex: number) => void;
    currentMoveIndex?: number;
    title?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
                                                            moves,
                                                            onMoveSelect,
                                                            currentMoveIndex = -1, // Значение по умолчанию, если не передано
                                                            title = "Ходы партии"
                                                        }) => {
    const activeMoveRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        // Прокрутка к активному ходу
        activeMoveRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [currentMoveIndex]);

    // Функция-парсер, которая приводит любой элемент к единому виду
    const parseMove = (moveData: string | MoveWithScore): { move: string, score?: number, delta?: number } => {
        if (typeof moveData === 'string') {
            return { move: moveData };
        }
        return moveData;
    };

    const pairedMoves: { white: any | null, black: any | null }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairedMoves.push({ white: moves[i] || null, black: moves[i + 1] || null });
    }

    const formatScore = (score: number) => {
        const value = (score / 100).toFixed(2);
        return score > 0 ? `+${value}` : value;
    };

    const getDeltaClass = (delta: number) => {
        if (delta > 25) return styles.goodMove;
        if (delta < -25) return styles.badMove;
        return '';
    }

    return (
        <div className={styles.moveHistory}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.list}>
                {pairedMoves.map(({ white, black }, index) => {
                    const moveNumber = index + 1;
                    const whiteMoveIndex = moveNumber * 2 - 1;
                    const blackMoveIndex = moveNumber * 2;

                    const whiteParsed = white ? parseMove(white) : null;
                    const blackParsed = black ? parseMove(black) : null;

                    return (
                        <div key={index} className={styles.movePair}>
                            <span className={styles.moveNumber}>{moveNumber}.</span>
                            <div
                                className={`${styles.moveContainer} ${onMoveSelect ? styles.selectable : ''} ${currentMoveIndex === whiteMoveIndex ? styles.active : ''} ${whiteParsed?.delta ? getDeltaClass(whiteParsed.delta) : ''}`}
                                onClick={() => onMoveSelect?.(whiteMoveIndex)}
                                ref={currentMoveIndex === whiteMoveIndex ? activeMoveRef : null}
                            >
                                <span>{whiteParsed?.move || '...'}</span>
                                {whiteParsed?.score !== undefined && <small>{formatScore(whiteParsed.score)}</small>}
                            </div>
                            {black ? (
                                <div
                                    className={`${styles.moveContainer} ${onMoveSelect ? styles.selectable : ''} ${currentMoveIndex === blackMoveIndex ? styles.active : ''} ${blackParsed?.delta ? getDeltaClass(blackParsed.delta) : ''}`}
                                    onClick={() => onMoveSelect?.(blackMoveIndex)}
                                    ref={currentMoveIndex === blackMoveIndex ? activeMoveRef : null}
                                >
                                    <span>{blackParsed?.move || '...'}</span>
                                    {blackParsed?.score !== undefined && <small>{formatScore(blackParsed.score)}</small>}
                                </div>
                            ) : <div className={styles.moveContainer}>...</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};