import { Cells, Coord } from "../../Types";

export abstract class Piece {
    index: { x: number; y: number };
    player: number;
    abstract type: 'pawn'|'scout'|'rook'|'knight'|'bishop'|'queen'|'king'|'dead_king';

    constructor(index: { x: number; y: number }, player: number) {
        this.index = index;
        this.player = player;
    }

    abstract getRawMoves(board: Cells[][]): Coord[];

    getRawAttacks(board: Cells[][]): Coord[] {
        return this.getRawMoves(board).filter(coord => {
            const target = board[coord.y]?.[coord.x];
            return !!target?.piece && target.piece.player !== this.player;
        });
    }

    protected collectMoves(board: Cells[][], dx: number, dy: number, maxStep: number = board.length, isPawn: boolean = false): Coord[] {
        const moves: Coord[] = [];
        const { x, y } = this.index;

        for (let step = 1; step <= maxStep; step++) {
            const target = board[y + dy * step]?.[x + dx * step];
            if (!target) break;
            if (!target.piece && !isPawn) {
                moves.push(target.index);
                continue;
            }
            if (target.piece && target.piece.player !== this.player) {
                moves.push(target.index);
            }
            break;
        }

        return moves;
    }
}