import { ORTHOGONAL_DIRECTIONS, DIAGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Princess extends Piece {
    type: 'princess' = 'princess';
    note: string = 'S';
    hasMoved: boolean = false;

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];

        for (const [dx, dy] of ORTHOGONAL_DIRECTIONS) {
            const maxStep = 2;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }
        for (const [dx, dy] of DIAGONAL_DIRECTIONS) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }

        return moves;
    }
}