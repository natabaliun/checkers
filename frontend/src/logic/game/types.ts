// Файл: frontend/src/logic/game/types.ts

export type PlayerColor = 'WHITE' | 'BLACK';
export type Position = { row: number; col: number };

export type Move = { from: Position; to: Position };
export type CaptureMove = { from: Position; to: Position; captured: Position };

export type FEN = string;