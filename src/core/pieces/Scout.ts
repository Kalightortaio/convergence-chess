import { OCTAGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Scout extends Piece {
    type: 'scout' = 'scout';
    note: string = 'Sc ';

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];
        for (const [dx, dy] of OCTAGONAL_DIRECTIONS) {
            const maxStep = (Math.abs(dx) === 1 && Math.abs(dy) === 1) ? 1 : 2;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }
        return moves;
    }
}