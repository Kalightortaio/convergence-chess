import { useEffect } from "react";
import { KNIGHT_DIRECTIONS, OCTAGONAL_DIRECTIONS, PAWN_FORWARD, PIECE_POINTS } from "../Constants";
import { King, Pawn, Piece } from "../core/pieces";
import { Player } from "../core/Player";
import { Cells, CellStateProps, Coord, Pieces } from "../Types";

type UseLegacyArgs = {
    board: Cells[][];
    players: Player[];
    turnNumber: number;
    turn: number;
    isPaused: boolean;
    CPUMove: CellStateProps | null;
    lastSelected: CellStateProps | null;
    setLastSelected: (cell: CellStateProps | null) => void;
    setCPUMove: (cell: CellStateProps | null) => void;
    doMove: (cell: CellStateProps) => void;
    readyNextTurn: () => void;
    getLastPawn: (player: Player) => Coord | null;
    getLastNonPawn: (player: Player) => boolean;
    simulateMove: (board: Cells[][], piece: Piece, to: Coord) => Cells[][];
    isCellAttackable: (board: Cells[][], coord: Coord, enemies: Player[]) => boolean;
    findKing: (board: Cells[][], player: Player) => Pieces;
    DEBUG_SHOW_LOG: boolean;
    DEBUG_IGNORE_TURNS: boolean;
};

// 0-depth AI that picks moves based on simple heuristics without lookahead, code will be sunset soon. Left in codebase for reference.
export function useLegacyZeroDepthEnemyAI(args: UseLegacyArgs) {
    const {
        board,
        players,
        turnNumber,
        turn,
        isPaused,
        CPUMove,
        lastSelected,
        setLastSelected,
        setCPUMove,
        doMove,
        readyNextTurn,
        getLastPawn,
        getLastNonPawn,
        simulateMove,
        isCellAttackable,
        findKing,
        DEBUG_SHOW_LOG,
        DEBUG_IGNORE_TURNS,
    } = args;

    useEffect(() => {
            if (isPaused) return;
            const player = players.find(p => p.id === turn);
            if (!player || !player.isCPU) return;
            const timer = setTimeout(() => {
                let start: number = 0, end: number = 0;
                if (DEBUG_SHOW_LOG) start = performance.now();
                const legalMoves = getAIMoves(player);
                if (DEBUG_SHOW_LOG) end = performance.now();
                if (DEBUG_SHOW_LOG) console.log(`AI Player ${player.id} legal move generation took ${(end - start).toFixed(2)} ms and found ${legalMoves.length} moves`);
                if (DEBUG_SHOW_LOG) start = performance.now();
                const chosen = pickAIMove(legalMoves);
                if (DEBUG_SHOW_LOG) end = performance.now();
                if (DEBUG_SHOW_LOG) console.log(`AI Player ${player.id} move selection took ${(end - start).toFixed(2)} ms`);
                if (!chosen) {
                    readyNextTurn();
                    console.warn("Error: AI could not find a valid move");
                    return;
                }
                const toCell = board[chosen.to.y][chosen.to.x];
                const fromCell = board[chosen.from.y][chosen.from.x];
                if (!toCell || !fromCell) return;
                setLastSelected(fromCell);
                setCPUMove(toCell);
            }, 1);
    
            return () => clearTimeout(timer);
        }, [turn, isPaused]);
    
        useEffect(() => {
            if (!CPUMove || !lastSelected) return;
            const movingPiece = lastSelected.piece;
            if (!movingPiece) {
                setCPUMove(null);
                setLastSelected(null);
                return;
            }
            const player = movingPiece.getPlayer();
            doMove(CPUMove);
            const moveCount = player.moveCount;
            if (DEBUG_IGNORE_TURNS || !player.isCPU) {
                readyNextTurn();
                return;
            }
            if (moveCount === 1) {
                const hasPawns = player.getPieces().some(p => p && p.type === "pawn");
                if (!hasPawns) {
                    readyNextTurn();
                    return;
                }
                const pawnMoves = getAIMoves(player).filter(m => m.piece && m.piece.type === "pawn");
                if (pawnMoves.length === 0) {
                    readyNextTurn();
                    return;
                }
                let bestScore = -Infinity;
                let best: LegalMove[] = [];
                for (const m of pawnMoves) {
                    const s = evaluateAIMove(m);
                    if (s > bestScore) {
                        bestScore = s;
                        best = [m];
                    } else if (s === bestScore) {
                        best.push(m);
                    }
                }
                if (bestScore <= 0) {
                    readyNextTurn();
                    return;
                }
                const second = best[Math.floor(Math.random() * best.length)];
                const from2 = board[second.from.y]?.[second.from.x];
                const to2   = board[second.to.y]?.[second.to.x];
                if (!from2 || !to2) {
                    readyNextTurn();
                    return;
                }
    
                setLastSelected(from2);
                setCPUMove(to2);
                return;
            }
    
            if (moveCount >= 2) {
                readyNextTurn();
            }
        }, [CPUMove, lastSelected]);

    type LegalMove = {
        piece: Pieces;
        from: Coord;
        to: Coord;
        isCapture: boolean;
    };

    function getAIMoves(player: Player): LegalMove[] {
        const legalMoves: LegalMove[] = [];
        const localCells = board.map(row => [...row]);
        const pieces = player.getPieces();

        for (const piece of pieces) {
            if (!piece) continue;
            const lastPawn = getLastPawn(piece.getPlayer());
            const lastNonPawn = getLastNonPawn(piece.getPlayer());
            if (piece.type !== "pawn" && lastNonPawn) continue;
            if (lastPawn && lastPawn.x === piece.index.x && lastPawn.y === piece.index.y) continue;
            if (piece.type === "king" && (piece as King).dead) continue;
            const moves = piece.getRawMoves(localCells);
            const enemies = players.filter(p => p !== piece.getPlayer() && !p.isDefeat);
            // Get the current king and see if it's in check
            const king = piece.getPlayer().getPieces().find(p => p && p.type === "king") as King | undefined;
            const isCurrentlyInCheck = !!king?.checked;
            for (const move of moves) {
                const targetCell = localCells[move.y][move.x];
                if (!targetCell) continue;
                // Check if this move would put own king in check
                const simulated = simulateMove(board, piece, move);
                const kingAfter = findKing(simulated, piece.getPlayer());
                if (!kingAfter) continue;
                const stillInCheck = isCellAttackable(simulated, kingAfter.index, enemies);
                if (isCurrentlyInCheck && stillInCheck) continue;
                if (stillInCheck) continue;
                // Special handling for pawn moves
                if (piece.type === "pawn") {
                    const isForward = targetCell && !targetCell.piece;
                    const attacks = piece.getRawAttacks(localCells);
                    const isAttackTarget = attacks.some(a => a.x === move.x && a.y === move.y);
                    if (!(isForward || isAttackTarget)) continue;
                }
                legalMoves.push({piece, from: { ...piece.index }, to: move, isCapture: !!targetCell.piece});
            }
        }
        return legalMoves;
    }

    function pickAIMove(moves: LegalMove[]): LegalMove {
        const scored = moves.map(m => ({
            move: m,
            score: evaluateAIMove(m),
        }));
        scored.sort((a, b) => b.score - a.score);
        const buckets: LegalMove[][] = [];
        let currentScore = scored[0].score;
        let currentBucket: LegalMove[] = [scored[0].move];
        for (let i = 1; i < scored.length; i++) {
            const { move, score } = scored[i];
            if (score === currentScore) {
                currentBucket.push(move);
            } else {
                buckets.push(currentBucket);
                currentScore = score;
                currentBucket = [move];
            }
        }
        buckets.push(currentBucket);
        const pickFromBucket = (idx: number): LegalMove => {
            const bucket = buckets[Math.min(idx, buckets.length - 1)];
            return bucket[Math.floor(Math.random() * bucket.length)];
        };
        const r = Math.random();
        if (r < 0.90 || buckets.length === 1) {
            return pickFromBucket(0);
        } else if (r < 0.99 || buckets.length === 2) {
            return pickFromBucket(1);
        } else {
            return pickFromBucket(2);
        }
    }

    function evaluateAIMove(move: LegalMove): number {
        if (!move.piece) return 0;
        let score = 0;

        const piece = move.piece;
        const pieceValue = PIECE_POINTS[piece.type];
        const player = piece.getPlayer();

        const from = move.from;
        const to = move.to;

        const targetCell = board[to.y]?.[to.x];
        const targetPiece = targetCell?.piece;
        const targetValue = targetPiece ? PIECE_POINTS[targetPiece.type] : 0;

        const boardAfter = simulateMove(board, piece, to);
        const enemies = players.filter(p => p !== player && !p.isDefeat);

        const destCellAfter = boardAfter[to.y]?.[to.x];
        const destPieceAfter = destCellAfter?.piece;
        const destAttacked = isCellAttackable(boardAfter, to, enemies);

        // Find defenders on the destination
        let defenderCount = 0;
        let strongestDefender = 0;
        const addDefender = (p: Pieces) => {
            if (!p) return;
            defenderCount++;
            const v = PIECE_POINTS[p.type];
            if (v > strongestDefender) strongestDefender = v;
        };
        for (const [kdx, kdy] of KNIGHT_DIRECTIONS) {
            const ny = to.y + kdy;
            const nx = to.x + kdx;
            const row = boardAfter[ny];
            if (!row) continue;
            const cell = row[nx];
            if (!cell || !cell.piece) continue;
            const p = cell.piece;
            if (p.getPlayer() !== player) continue;
            if (p.type === "knight") {
                addDefender(p);
            }
        }
        for (const [dx, dy] of OCTAGONAL_DIRECTIONS) {
            let ny = to.y + dy;
            let nx = to.x + dx;
            let step = 1;
            while (true) {
                const row = boardAfter[ny];
                if (!row) break;
                const cell = row[nx];
                if (!cell) break;
                const p = cell.piece;
                if (!p) {
                    ny += dy;
                    nx += dx;
                    step++;
                    continue;
                }
                if (p.getPlayer() !== player) break;
                const isOrth = dx === 0 || dy === 0;
                const isDiag = !isOrth;
                switch (p.type) {
                    case "rook":
                        if (isOrth) addDefender(p);
                        break;
                    case "bishop":
                        if (isDiag) addDefender(p);
                        break;
                    case "queen":
                        addDefender(p);
                        break;
                    case "king":
                    case "prince":
                        if (step === 1) addDefender(p);
                        break;
                    case "princess":
                        if ((isOrth && step <= 2) || (isDiag && step === 1)) {
                            addDefender(p);
                        }
                        break;
                    case "pawn": {
                        if (step === 1 && isDiag) {
                            const [fx, fy] = PAWN_FORWARD[p.getPlayer().id];
                            const pawnDiagonals: [number, number][] =
                                fx === 0 ? [[1, fy], [-1, fy]] : [[fx, 1], [fx, -1]];
                            const vx = -dx;
                            const vy = -dy;
                            if (pawnDiagonals.some(([px, py]) => px === vx && py === vy)) {
                                addDefender(p);
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
        const defended = defenderCount > 0;

        // Find strongest attacker on the destination
        let strongestAttacker = 0;
        if (destAttacked) {
            for (const enemy of enemies) {
                for (const ep of enemy.getPieces()) {
                    if (!ep) continue;
                    const attacks = ep.getRawAttacks(boardAfter);
                    if (attacks.some(a => a.x === to.x && a.y === to.y)) {
                        const v = PIECE_POINTS[ep.type];
                        if (v > strongestAttacker) strongestAttacker = v;
                    }
                }
            }
        }

        // Encourage pressure around enemy kings
        if (piece.type !== "king") {
            const liveEnemyKings = enemies
                .map(e => findKing(board, e) as King | null)
                .filter(k => k && !(k as King).dead) as King[];
            if (liveEnemyKings.length > 0) {
                let bestBefore = Infinity;
                let bestAfter = Infinity;
                for (const ek of liveEnemyKings) {
                    const kx = ek.index.x;
                    const ky = ek.index.y;
                    const before = Math.abs(from.x - kx) + Math.abs(from.y - ky);
                    const after = Math.abs(to.x - kx) + Math.abs(to.y - ky);
                    if (before < bestBefore) bestBefore = before;
                    if (after < bestAfter) bestAfter = after;
                }
                if (bestAfter < bestBefore) {
                    score += Math.min(pieceValue, 5);
                }
            }
        }

        // Check evaluation
        if (piece.type !== "king" && destPieceAfter) {
            const attacksAfter = destPieceAfter.getRawAttacks(boardAfter);
            let givesCheck = false;

            for (const enemy of enemies) {
                const enemyKing = findKing(boardAfter, enemy) as King | null;
                if (!enemyKing || (enemyKing as King).dead) continue;
                if (attacksAfter.some(a => a.x === enemyKing.index.x && a.y === enemyKing.index.y)) {
                    givesCheck = true;
                    break;
                }
            }

            if (givesCheck) {
                score += 8;
            }
        }

        // King of the hill win-condition
        if (piece.type === "king") {
            const hill = [
                {x: 8, y: 8}, {x: 9, y: 8},
                {x: 8, y: 9}, {x: 9, y: 9},
            ];
            const from = move.from;
            const to = move.to;
            let fromDist = 100;
            let toDist = 100;
            for (const h of hill) {
                fromDist = Math.min(fromDist, Math.abs(from.x - h.x) + Math.abs(from.y - h.y));
                toDist   = Math.min(toDist,   Math.abs(to.x   - h.x) + Math.abs(to.y   - h.y));
            }
            if (toDist < fromDist) score += 10;
        }

        // Central control bonus
        const inCenter =
        move.to.x >= 5 && move.to.x <= 12 &&
        move.to.y >= 5 && move.to.y <= 12;
        if (inCenter) {
            if (piece.type === "pawn") {
                score += 1;
            } else {
                score += 6;
            }
        } else if (piece.type !== "pawn") {
            score += 1;
        }

        // En passant capture bonus
        if (piece.type === "pawn" && !targetPiece) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                const cand1 = board[from.y]?.[to.x];
                const cand2 = board[to.y]?.[from.x];
                const candidates = [cand1, cand2];
                let epValue = 0;
                for (const cand of candidates) {
                    const epPawn = cand?.piece as Pawn | undefined;
                    if (!epPawn || epPawn.type !== "pawn" || epPawn.getPlayer() === player) continue;
                    for (let i = 0; i < epPawn.isEnPassantTarget.length; i++) {
                        const sq = epPawn.enPassantSquare[i];
                        if (epPawn.isEnPassantTarget[i] && sq && sq.x === to.x && sq.y === to.y) {
                            epValue = PIECE_POINTS["pawn"];
                            break;
                        }
                    }
                    if (epValue > 0) break;
                }
                score += epValue;
            }
        }

        // Risk assessment
        if (destAttacked) {
            if (defended) {
                if (move.isCapture && targetValue) {
                    if (targetValue > pieceValue) {
                        score += (targetValue - pieceValue);
                    } else if (targetValue === pieceValue) {
                        score += 2;
                    } else {
                        score -= Math.floor((pieceValue - targetValue) * 0.5);
                    }
                } else {
                    score -= Math.floor(pieceValue * 0.2);
                }
            } else {
                if (move.isCapture && targetValue) {
                    if (targetValue > pieceValue) {
                        score += Math.floor((targetValue - pieceValue) * 0.5);
                    } else if (targetValue === pieceValue) {
                        score += 1;
                    } else {
                        score -= (pieceValue - targetValue) * 2;
                    }
                } else {
                    score -= pieceValue * 2;
                }
            }
        } else {
            if (move.isCapture && targetValue) {
                score += targetValue;
            }
        }

        // Pawn promotion bonus
        if (piece.type === "pawn") {
            const [fx, fy] = PAWN_FORWARD[player.id];
            let pathBlockedByOwnPawn = false;
            for (let step = 1; step <= 4; step++) {
                const ny = to.y + fy * step;
                const nx = to.x + fx * step;
                const cell = boardAfter[ny]?.[nx];
                if (!cell) break;
                if (!cell.piece) continue;
                if (cell.piece.getPlayer() === player && cell.piece.type === "pawn") {
                    pathBlockedByOwnPawn = true;
                    break;
                } else {
                    break;
                }
            }
            const backlineHit =
                (player.id === 1 && to.y <= 0) ||
                (player.id === 2 && to.x >= 17) ||
                (player.id === 3 && to.y >= 17) ||
                (player.id === 4 && to.x <= 0);
            const sideHit =
                (player.id === 1 && to.y === 5 && (to.x < 5 || to.x > 12)) ||
                (player.id === 2 && to.x === 12 && (to.y < 5 || to.y > 12)) ||
                (player.id === 3 && to.y === 12 && (to.x < 5 || to.x > 12)) ||
                (player.id === 4 && to.x === 5 && (to.y < 5 || to.y > 12));
            if (backlineHit) {
                score += pathBlockedByOwnPawn ? Math.floor(PIECE_POINTS["queen"] * 0.4) : PIECE_POINTS["queen"];
            } else if (sideHit) {
                score += pathBlockedByOwnPawn ? Math.floor(PIECE_POINTS["prince"] * 0.4) : PIECE_POINTS["prince"];
            }
        }

        // Pawn structure bonus
        if (piece.type === "pawn") {
            let neighborBefore = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ny = from.y + dy;
                    const nx = from.x + dx;
                    const cell = board[ny]?.[nx];
                    const p = cell?.piece;
                    if (p && p.type === "pawn" && p.getPlayer() === player) {
                        neighborBefore++;
                    }
                }
            }
            let neighborAfter = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const ny = to.y + dy;
                    const nx = to.x + dx;
                    const cell = boardAfter[ny]?.[nx];
                    const p = cell?.piece;
                    if (p && p.type === "pawn" && p.getPlayer() === player) {
                        neighborAfter++;
                    }
                }
            }
            if (!move.isCapture && neighborBefore >= 2 && neighborAfter < neighborBefore) {
                score -= 3;
            }
            if (neighborAfter === 0) {
                score -= 1;
            } else if (neighborAfter <= 2) {
                score += neighborAfter * 2;
            } else {
                score += 1;
            }
            const ownPawns = player.getPieces().filter(p => p && p.type === "pawn").length;
            if (ownPawns >= 5) {
                let pawnDepth = 0;
                if (player.id === 1) pawnDepth = 17 - to.y;
                if (player.id === 3) pawnDepth = to.y;
                if (player.id === 2) pawnDepth = to.x;
                if (player.id === 4) pawnDepth = 17 - to.x;
                if (pawnDepth >= 4 && neighborAfter === 0) {
                    const overextendPenalty = Math.min(pawnDepth, 5);
                    score -= overextendPenalty;
                }
            }
        }

        // Penalize moves that reduce king mobility
        if (piece.type !== "king") {
            const kingBefore = findKing(board, player);
            const kingAfter  = findKing(boardAfter, player);
            if (kingBefore && kingAfter) {
                const beforeMoves = kingBefore.getRawMoves(board);
                const afterMoves  = kingAfter.getRawMoves(boardAfter);
                if (afterMoves.length < beforeMoves.length) {
                    score -= 2;
                }
            }
        }

        // Castling bonus
        if (piece.type === "king") {
            const dx = Math.abs(move.to.x - move.from.x);
            const dy = Math.abs(move.to.y - move.from.y);
            if (dx === 2 || dy === 2) {
                score += 40;
            }
        }

        // Encourage moving non-pawn, non-king pieces out of home area
        if (piece.type !== "pawn" && piece.type !== "king") {
            const phase = Math.min(turnNumber, 20) / 20;
            const fromHome =
                (player.id === 1 && from.y >= 13) ||
                (player.id === 2 && from.x <= 4)  ||
                (player.id === 3 && from.y <= 4)  ||
                (player.id === 4 && from.x >= 13);
            const toHome =
                (player.id === 1 && to.y >= 13) ||
                (player.id === 2 && to.x <= 4)  ||
                (player.id === 3 && to.y <= 4)  ||
                (player.id === 4 && to.x >= 13);
            if (fromHome && !toHome) {
                score += 20 + 30 * phase;
            } else if (!toHome) {
                score += 8 * phase;
            }
        }

        // Two king capture win-condition
        if (targetPiece?.type === "king" && (targetPiece as King).dead) {
            score += 100000;
        }


        // Encourage adding more defenders around moved pieces
        score += defenderCount;

        // Encourage increasing influence with non-pawn, non-king pieces on truly safe squares
        if (piece.type !== "pawn" && piece.type !== "king" && destPieceAfter) {
            const safeSquare = !destAttacked || strongestDefender >= strongestAttacker;
            if (!safeSquare) return score;
            const attacksAfter = destPieceAfter.getRawAttacks(boardAfter);
            let influence = 0;
            for (const a of attacksAfter) {
                const tCell = boardAfter[a.y]?.[a.x];
                if (!tCell) continue;
                const tp = tCell.piece;
                if (!tp) {
                    influence += 0.25;
                } else if (enemies.includes(tp.getPlayer())) {
                    influence += Math.min(PIECE_POINTS[tp.type], 3);
                }
            }
            score += influence;
        }

        // Retreat bonus for saving high value pieces
        if (piece.type !== "pawn" && piece.type !== "king") {
            const fromAttacked = isCellAttackable(board, from, enemies);
            const destSafeOrBetter =
                !destAttacked || strongestDefender >= strongestAttacker;
            if (fromAttacked && destSafeOrBetter && pieceValue >= PIECE_POINTS["rook"]) {
                const retreatGain = Math.min(pieceValue, 6);
                score += retreatGain;
            }
        }

        // King of the hill defense
        const hillSquares = [
            { x: 8, y: 8 }, { x: 9, y: 8 },
            { x: 8, y: 9 }, { x: 9, y: 9 },
        ];
        let minEnemyHillDist = 10000;
        for (const enemy of enemies) {
            const enemyKing = findKing(board, enemy) as King | null;
            if (!enemyKing || (enemyKing as King).dead) continue;

            let kDist = 10000;
            for (const h of hillSquares) {
                const d = Math.abs(enemyKing.index.x - h.x) + Math.abs(enemyKing.index.y - h.y);
                if (d < kDist) kDist = d;
            }
            if (kDist < minEnemyHillDist) minEnemyHillDist = kDist;
        }
        if (minEnemyHillDist < 10000 && piece.type !== "king") {
            const safeSquare = !destAttacked || strongestDefender >= strongestAttacker;
            if (safeSquare) {
                let fromHillDist = 10000;
                let toHillDist = 10000;
                for (const h of hillSquares) {
                    const dFrom = Math.abs(from.x - h.x) + Math.abs(from.y - h.y);
                    const dTo   = Math.abs(to.x   - h.x) + Math.abs(to.y   - h.y);
                    if (dFrom < fromHillDist) fromHillDist = dFrom;
                    if (dTo   < toHillDist)   toHillDist   = dTo;
                }
                const urgency = Math.max(0, 7 - minEnemyHillDist);
                if (toHillDist < fromHillDist) {
                    score += urgency * 3;
                }
                if (hillSquares.some(h => h.x === to.x && h.y === to.y)) {
                    score += urgency * 8;
                }
                if (destPieceAfter) {
                    const attacksAfter = destPieceAfter.getRawAttacks(boardAfter);
                    const attacksHill = attacksAfter.some(a =>
                        hillSquares.some(h => h.x === a.x && h.y === a.y)
                    );
                    if (attacksHill) {
                        score += urgency * 4;
                    }
                }
            }
        }

        // Encourage increasing mobility with long-range pieces on safe squares
        if (destPieceAfter && (piece.type === "rook" || piece.type === "bishop" || piece.type === "prince" || piece.type === "princess")) {
            const safeSquare = !destAttacked || strongestDefender >= strongestAttacker;
            if (safeSquare) {
                score += PIECE_POINTS[piece.type] * 0.5;
            }
        }

        // Extra discouragement of queen moves to unsafe squares
        if (piece.type === "queen") {
            const unsafeSquare = destAttacked && strongestDefender < strongestAttacker;
            const badOrNoTrade = !move.isCapture || targetValue <= pieceValue;

            if (unsafeSquare && badOrNoTrade) {
                score -= 1000;
            }
        }

        // Slightly discourage pointless pawn moves
        if (piece.type === "pawn" && !move.isCapture) {
            score -= 1;
        }

        // Discourage undoing or repeating recent moves
        const fromAttacked = isCellAttackable(board, from, enemies);
        const safeTo = !destAttacked || strongestDefender >= strongestAttacker;
        const clearlyEscaping = fromAttacked && safeTo && !move.isCapture;
        const goodCapture = move.isCapture && targetValue && targetValue >= pieceValue;
        const lastTurn = player.lastTurnMoves;
        const thisTurn = player.currentTurnMoves;
        for (const m of thisTurn) {
            const undoThisTurn =
                m.from.x === to.x && m.from.y === to.y &&
                m.to.x === from.x && m.to.y === from.y;
            if (undoThisTurn) {
                score -= 40;
            }
        }
        for (const m of lastTurn) {
            const undoLastTurn =
                m.from.x === to.x && m.from.y === to.y &&
                m.to.x === from.x && m.to.y === from.y;

            const repeatLastTurn =
                m.from.x === from.x && m.from.y === from.y &&
                m.to.x === to.x && m.to.y === to.y;

            if (undoLastTurn && !clearlyEscaping && !goodCapture) {
                score -= 30;
            }
            if (repeatLastTurn && !clearlyEscaping && !goodCapture) {
                score -= 10;
            }
        }
        const pieceStreak = piece.pieceStreak || 0;
        if (!piece.onlyChoice && pieceStreak > 1) {
            const phase = Math.min(turnNumber, 80) / 80;
            const loopPenalty = pieceStreak * pieceValue * (0.2 + 0.3 * phase);
            score -= loopPenalty;
        }
        
        
        // Encourage developing pieces that have not moved much yet
        const pieceMoves = piece.pieceMoveCounter || 0;
        if (piece.type !== "pawn" && piece.type !== "king") {
            const phase = Math.min(turnNumber, 40) / 40;
            
            const myPieces = player.getPieces().filter(p => p) as Piece[];
            const comparable = myPieces.filter(p => p.type === piece.type);
            
            const avgMoves =
            comparable.length > 0
            ? comparable.reduce((sum, p) => sum + (p.pieceMoveCounter || 0), 0) /
            comparable.length
            : 0;
            
            if (pieceMoves === 0 && phase > 0.25) {
                score += pieceValue * (0.3 + phase);
            } else if (pieceMoves < avgMoves && phase > 0.5) {
                score += pieceValue * 0.2;
            }
        }

        return score;
    }
}