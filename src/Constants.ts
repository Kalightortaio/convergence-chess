import { Dimensions } from 'react-native';
import { PieceType } from './core/pieces/Piece';

export const gridSize = 18;
export const screenWidth = Dimensions.get('window').width;
export const cellSize = (screenWidth / gridSize);
export const boardSize = gridSize * cellSize;

export const scaleText = (fontSize: number): number => {
    const baseScreenWidth = 450;
    const scale = screenWidth / baseScreenWidth;
    return Math.round(fontSize * scale);
};

export const ORTHOGONAL_DIRECTIONS: [number, number][] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
];
export const DIAGONAL_DIRECTIONS: [number, number][] = [
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];
export const OCTAGONAL_DIRECTIONS = [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
export const PAWN_FORWARD: Record<number, [number, number]> = {
    1: [0, -1],
    2: [1,  0],
    3: [0,  1],
    4: [-1, 0],
};
export const KNIGHT_DIRECTIONS: [number, number][] = [ 
    [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
export const PIECE_POINTS: Record<PieceType, number> = {
  pawn: 1,
  bishop: 3,
  rook: 3,
  knight: 7,
  scout: 13,
  queen: 21,
  king: 30,
  dead_king: 0,
};