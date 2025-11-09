import { Cells, Coord } from "../../Types";
import { Player } from "../Player";

export type PieceType = 'pawn'|'scout'|'rook'|'knight'|'bishop'|'queen'|'king'|'dead_king';

export abstract class Piece {
    index: { x: number; y: number };
    player: Player;
    abstract type: PieceType;
    abstract note: string;
    onlyChoice: boolean = false;

    constructor(index: { x: number; y: number }, player: Player) {
        this.index = index;
        this.player = player;
        player.addPiece(this);
    }

    getPlayer(): Player {
        return this.player;
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