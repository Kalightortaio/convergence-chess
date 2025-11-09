import { DIAGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Bishop extends Piece {
    type: 'bishop' = 'bishop';
    note: string = 'B';

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];

        for (const [dx, dy] of DIAGONAL_DIRECTIONS) {
            moves.push(...this.collectMoves(board, dx, dy));
        }
        return moves;
    }
}