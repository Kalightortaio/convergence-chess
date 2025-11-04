import { Piece } from "./core/pieces/Piece";

export interface CellStateProps {
    index: { x: number; y: number };
    piece: Pieces;
    selected: boolean;
    shaded: boolean;
}

export type Pieces = (Piece | null);
export type Cells = (CellStateProps | null);
export interface Coord { x: number; y: number; };