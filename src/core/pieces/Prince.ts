import { OCTAGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Prince extends Piece {
    type: 'prince' = 'prince';
    note: string = 'P';
    hasMoved: boolean = false;

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];

        for (const [dx, dy] of OCTAGONAL_DIRECTIONS) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }

        return moves;
    }
}