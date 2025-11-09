import { KNIGHT_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Knight extends Piece {
    type: "knight" = "knight";
    note: string = 'Kn ';
    
    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];
        
        for (const [dx, dy] of KNIGHT_DIRECTIONS) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }
        return moves;
    }
}