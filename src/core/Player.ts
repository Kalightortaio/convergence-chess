import { PIECE_POINTS, TURN_LIMIT } from "../Constants";
import { CornerPosition } from "../Types";
import { Piece, PieceType } from "./pieces/Piece";

export class Player { //abstract later
    id: number;
    name: string;
    title: string;  
    rightColor: string;
    leftColor: string;
    middleColor: string;
    topColor: string;
    botColor: string;
    photo: { uri: string } | number;
    position: CornerPosition;
    pieces: Piece[] = [];
    capturedPieces: { type: PieceType; count: number }[] = [];
    score: number = 0;
    isDefeat: boolean = false;
    lastMove: string = "";
    timeRemaining: number = TURN_LIMIT;
    moveCount: number = 0;
    isCPU: boolean;

    constructor(id: number, name: string, title: string, rightColor: string, leftColor: string, photo: ({ uri: string } | number), position: CornerPosition, isCPU: boolean = false) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.rightColor = rightColor;
        this.leftColor = leftColor;
        this.middleColor = this.blendColors(rightColor, leftColor);
        this.topColor = this.blendColors(this.middleColor, leftColor);
        this.botColor = this.blendColors(this.middleColor, rightColor);
        this.photo = photo;
        this.position = position;
        this.isCPU = isCPU;
    }

    getPieces(): Piece[] {
        return this.pieces;
    }

    addPiece(piece: Piece): void {
        this.pieces.push(piece);
    }

    removePiece(piece: Piece): void {
        this.pieces = this.pieces.filter(p => p !== piece);
    }

    getCapturedPieces(): { type: PieceType; count: number }[] {
        return this.capturedPieces;
    }

    addCapturedPiece(type: PieceType): void {
        const existing = this.capturedPieces.find(p => p.type === type);
        if (existing) existing.count++;
        else this.capturedPieces.push({ type, count: 1 });
        this.updateScore();
    }

    removeCapturedPiece(type: PieceType): void {
        const existing = this.capturedPieces.find(p => p.type === type);
        if (existing) {
        existing.count--;
        if (existing.count <= 0)
            this.capturedPieces = this.capturedPieces.filter(p => p.type !== type);
        }
    }

    resetCapturedPieces(): void {
        this.capturedPieces = [];
    }

    updateScore(): void {
        this.score = this.capturedPieces.reduce((sum, piece) => {
        const value = PIECE_POINTS[piece.type] || 0;
        return sum + value * piece.count;
        }, 0);
    }

    private blendColors(hex1: string, hex2: string): string {
        const parseHex = (hex: string) => hex.replace('#', '');
        const toInt = (hex: string) => parseInt(hex, 16);
        
        const c1 = parseHex(hex1);
        const c2 = parseHex(hex2);

        const r1 = toInt(c1.substring(0, 2));
        const g1 = toInt(c1.substring(2, 4));
        const b1 = toInt(c1.substring(4, 6));

        const r2 = toInt(c2.substring(0, 2));
        const g2 = toInt(c2.substring(2, 4));
        const b2 = toInt(c2.substring(4, 6));

        const rMid = Math.round((r1 + r2) / 2);
        const gMid = Math.round((g1 + g2) / 2);
        const bMid = Math.round((b1 + b2) / 2);

        const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(rMid)}${toHex(gMid)}${toHex(bMid)}`;
    }
}