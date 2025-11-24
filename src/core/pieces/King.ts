import { OCTAGONAL_DIRECTIONS } from "../../Constants";
import { Cells, Coord } from "../../Types";
import { Piece } from "./Piece";
import { Rook } from "./Rook";

export class King extends Piece {
    type: 'king' = 'king';
    note: string = 'K';
    hasMoved: boolean = false;
    checked: boolean = false;
    dead: boolean = false;

    getRawMoves(board: Cells[][]): Coord[] {
        const moves: Coord[] = [];
        const { x, y } = this.index
        const player = this.getPlayer()

        for (const [dx, dy] of OCTAGONAL_DIRECTIONS) {
            const maxStep = 1;
            moves.push(...this.collectMoves(board, dx, dy, maxStep));
        }

        if (!this.hasMoved) {
            const rooks = player.getPieces().filter(p => p?.type === "rook" && !(p as Rook).hasMoved);
            for (const rook of rooks) {
                const rX = rook.index.x;
                const rY = rook.index.y;
                if (player.id % 2 && rY === y) {
                    const step = Math.sign(rX - x)
                    let clear = true
                    for (let i = x + step; i !== rX; i += step) {
                        if (board[y][i]?.piece) { clear = false; break }
                    }
                    if (clear) {
                        moves.push({ x: x + 2 * step, y })
                    }
                }
                if (!(player.id % 2) && rX === x) {
                    const step = Math.sign(rY - y)
                    let clear = true
                    for (let j = y + step; j !== rY; j += step) {
                        if (board[j][x]?.piece) { clear = false; break }
                    }
                    if (clear) {
                        moves.push({ x, y: y + 2 * step })
                    }
                }
            }
        }
        return moves;
    }
}