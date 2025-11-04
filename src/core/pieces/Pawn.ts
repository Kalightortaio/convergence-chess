import { PAWN_FORWARD } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Pawn extends Piece {
    type: 'pawn' = 'pawn';
    hasMoved: boolean = false;
    isEnPassantTarget: boolean = false;

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];
        const { x, y } = this.index;
        const [fx, fy] = PAWN_FORWARD[this.player];

        const step1 = board[y + fy]?.[x + fx];
        if (step1 && !step1.piece) {
            moves.push(step1.index);
        }

        const step2 = board[y + fy * 2]?.[x + fx * 2];
        if (!this.hasMoved && step1 && !step1.piece && step2 && !step2.piece) {
            moves.push(step2.index);
        }

        const diagonals: [number, number][] = [
            [fx + fy, fy + fx],
            [fx - fy, fy - fx],
        ];
        for (const [dx, dy] of diagonals) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep, true));
        }

        for (const [dx, dy] of diagonals) {
            const diagonalSquare = board[y + dy]?.[x + dx];
            if (!diagonalSquare || diagonalSquare.piece) continue;

            const adjacentPawnSquare = board[y]?.[x + dx];
            const adjacentPawn = adjacentPawnSquare?.piece;
            if (adjacentPawn?.type === "pawn" && adjacentPawn.player !== this.player && (adjacentPawn as Pawn).isEnPassantTarget) {
                moves.push(diagonalSquare.index);
            }
        }

        return moves;
    }
}