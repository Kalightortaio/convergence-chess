type PieceType = 'pawn' | 'scout' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type CellColor = 'white' | 'black';

interface Piece {
    type: PieceType;
    player: number;
}

export interface CellStateProps {
    index: { x: number; y: number };
    piece: Piece | null;
}