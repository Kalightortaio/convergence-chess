import { Piece } from "./core/pieces/Piece";

export interface CellStateProps {
    index: Coord;
    piece: Pieces;
    selected: boolean;
    shaded: boolean;
}

export type Pieces = (Piece | null);
export type Cells = (CellStateProps | null);
export type CornerPosition = ('topLeft' | 'topRight' | 'botLeft' | 'botRight');
export interface Coord { x: number; y: number; };

export type RootStackParamList = {
    Game: undefined;
    Profile: undefined;
    Learn: undefined;
};