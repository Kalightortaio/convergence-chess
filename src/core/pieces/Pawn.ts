import { ORTHOGONAL_DIRECTIONS, PAWN_FORWARD } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";

export class Pawn extends Piece {
    type: 'pawn' = 'pawn';
    note: string = '';
    isEnPassantTarget: boolean[] = [];
    enPassantSquare: (Coord | null)[] = [];

    sameCoord(a: Coord | null, b: Coord): boolean {
        return !!a && a.x === b.x && a.y === b.y;
    }

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];
        const { x, y } = this.index;
        const [fx, fy] = PAWN_FORWARD[this.getPlayer().id];

        const step1 = board[y + fy]?.[x + fx];
        if (step1 && !step1.piece) {
            moves.push(step1.index);
        }

        const step2 = board[y + fy * 2]?.[x + fx * 2];
        if (step1 && !step1.piece && step2 && !step2.piece) {
            moves.push(step2.index);
        }

        const diagonals: [number, number][] = fx === 0 ? [[1, fy], [-1, fy]] : [[fx, 1], [fx, -1]];

        for (const [dx, dy] of diagonals) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep, true));
        }

        for (const [dx, dy] of diagonals) {
            const diagonalSquare = board[y + dy]?.[x + dx];
            if (!diagonalSquare || diagonalSquare.piece) continue;
            
            for (const [ox, oy] of ORTHOGONAL_DIRECTIONS) {
                const adjCell = board[y + oy]?.[x + ox];
                const adjPawn = adjCell?.piece as Pawn | null;
                if (!adjPawn || adjPawn.type !== "pawn" || adjPawn.getPlayer() === this.getPlayer()) continue;

                for (let i = 0; i < adjPawn.isEnPassantTarget.length; i++) {
                    if (adjPawn.isEnPassantTarget[i] && this.sameCoord(adjPawn.enPassantSquare[i], diagonalSquare.index)) {
                        moves.push(diagonalSquare.index);
                    }
                }
            }
        }

        return moves;
    }
}