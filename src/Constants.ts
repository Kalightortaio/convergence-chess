import { PieceType } from './core/pieces/Piece';

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
  prince: 4,
  bishop: 9,
  rook: 9,
  knight: 9,
  princess: 16,
  queen: 25,
  king: 36,
};
export const TURN_LIMIT = 60;