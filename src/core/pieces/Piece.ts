import { Cells, Coord } from "../../Types";
import { Player } from "../Player";

export type PieceType = 'pawn'|'prince'|'rook'|'knight'|'bishop'|'queen'|'king'|'princess';

export abstract class Piece {
    index: { x: number; y: number };
    player: Player;
    abstract type: PieceType;
    abstract note: string;
    onlyChoice: boolean = false;
    pieceMoveCounter: number = 0;
    pieceStreak: number = 0;
    lastTurnMoved: number = -1;

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

    registerMove(turnNumber: number) {
        if (this.lastTurnMoved === turnNumber - 1) {
            this.pieceStreak += 1;
        } else if (this.lastTurnMoved !== turnNumber) {
            this.pieceStreak = 1;
        }
        this.lastTurnMoved = turnNumber;
        this.pieceMoveCounter += 1;
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