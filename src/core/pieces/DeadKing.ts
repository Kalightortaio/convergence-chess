import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class DeadKing extends Piece {
    type: 'dead_king' = 'dead_king';

    getRawMoves(_: Cells[][]): Coord[] {
        return [];
    }
}