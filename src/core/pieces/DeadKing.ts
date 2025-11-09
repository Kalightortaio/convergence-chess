import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class DeadKing extends Piece {
    type: 'dead_king' = 'dead_king';
    note: string = 'X';

    getRawMoves(_: Cells[][]): Coord[] {
        return [];
    }
}