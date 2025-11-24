import { ORTHOGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Rook extends Piece {
    type: 'rook' = 'rook';
    note: string = 'R';
    hasMoved: boolean = false;
    canCastle : boolean = false;

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];

        for (const [dx, dy] of ORTHOGONAL_DIRECTIONS) {
            moves.push(...this.collectMoves(board, dx, dy));
        }
        
        return moves;
    }
}