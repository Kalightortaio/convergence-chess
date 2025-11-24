import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Modal, TouchableWithoutFeedback, Text } from 'react-native';
import { Cells, CellStateProps, Coord, Pieces, RootStackParamList } from '../Types';
import { PAWN_FORWARD, PIECE_POINTS, TURN_LIMIT } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { Pawn, Prince, Rook, Knight, Bishop, Queen, King, Princess, Piece } from "../core/pieces";
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationProvider } from '../components/NavigationProvider';
import PlayerUI from '../components/PlayerUI';
import { Player } from '../core/Player';
import TurnIndicator from '../components/TurnIndicator';
import { useDimensions } from "../hooks/useDimensions";
import MoveHistory from '../components/MoveHistory';
import Checkbox from 'expo-checkbox';

type GameProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Game'>;
};

export default function Game({ navigation }: GameProps) {
    const { cellSize, boardSize, gridSize, isPortrait, overlaySize, visibleWidth, usableHeight, scaleText } = useDimensions();
    // Temp until Lobby is made
    // Todo: Allow players to choose their colors in the lobby. Names and profile pics should be fetched from their profiles, and can be changed on the fly.
    const [players, setPlayers] = useState<Player[]>(() => [
        new Player(1, "Red", "Novice", "#800000", "#FF0000", {uri: "https://randomuser.me/api/portraits/men/42.jpg"}, "botRight", true),
        new Player(2, "Blue", "Adept", "#0000FF", "#87CEEB", {uri: "https://randomuser.me/api/portraits/women/0.jpg"}, "botLeft", true),
        new Player(3, "Green", "Comeback Kid", "#006400", "#00FF7F", {uri: "https://randomuser.me/api/portraits/men/16.jpg"}, "topLeft", true),
        new Player(4, "Purple", "Grandmaster", "#670bb8ff", "#d900ffff", {uri: "https://randomuser.me/api/portraits/women/7.jpg"}, "topRight", true),
    ]);

    const [turn, setTurn] = useState<number>(1);
    const [board, setBoard] = useState<Cells[][]>(() => initBoard());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);
    const [lastSelected, setLastSelected] = useState<CellStateProps | null>(null);
    const [CPUMove, setCPUMove] = useState<CellStateProps | null>(null);
    const [viewRotation, setViewRotation] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [settingsModal, setSettingsModal] = useState(false);
    const [isChecked, setIsChecked] = useState<{ [key: string]: boolean }>({ test: false });
    const DEBUG_FROZEN_ARMY = true; // When your checkmated, you lose control of your pieces but they remain on the board. Will eventually be a lobby feature.
    const DEBUG_IGNORE_TURNS = false; // For testing purposes only, allows moving any piece at any time.
    const DEBUG_TIME_DISABLED = true; // Disables the timer for testing purposes, eventually to be a lobby feature.
    const DEBUG_AUTO_ROTATE = false; // Automatically rotates the view to the current player at the start of their turn.
    const currentPlayer = players.find(p => p.id === turn);

    function initBoard(): Cells[][] {
        const initialCells: Cells[][] = [];
        for (let row = 0; row < gridSize; row++) {
            const currentRow: Cells[] = [];
            for (let col = 0; col < gridSize; col++) {
                const inCenter = col >= 5 && col <= 12 && row >= 5 && row <= 12;
                const inHorizontalArm = row >= 5 && row <= 12;
                const inVerticalArm = col >= 5 && col <= 12;
                if (inCenter || inHorizontalArm || inVerticalArm) {
                    const piece = getStartingPieces(row, col);
                    currentRow.push({ index: { x: col, y: row }, piece: piece, selected: false, shaded: false });
                } else {
                    currentRow.push(null);
                }
            }
            initialCells.push(currentRow);
        }
        return initialCells;
    }

    function getStartingPieces(row: number, col: number): Pieces {
        const layouts = {
            front: Array(8).fill('pawn'),
            middle: ['prince', 'prince', 'prince', 'princess', 'princess', 'prince', 'prince', 'prince'],
            back: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        } as const;

        const pickPiece = (index: number, player: Player, rank: keyof typeof layouts, flipped = false) => {
            const localIndex = index - 5;
            const order = flipped ? [...layouts[rank]].reverse() : layouts[rank];
            const type = order[localIndex % order.length];
            const position = { x: col, y: row };

            switch (type) {
                case "pawn":     return new Pawn(position, player);
                case "prince":    return new Prince(position, player);
                case "rook":     return new Rook(position, player);
                case "knight":   return new Knight(position, player);
                case "bishop":   return new Bishop(position, player);
                case "queen":    return new Queen(position, player);
                case "king":     return new King(position, player);
                case "princess":  return new Princess(position, player);
                default:         return null;
            }
        }

        const p1 = players[0], p2 = players[1], p3 = players[2], p4 = players[3];
        if (row === 15) return pickPiece(col, p1, 'front');
        if (row === 16) return pickPiece(col, p1, 'middle');
        if (row === 17) return pickPiece(col, p1, 'back');
        if (col === 2)  return pickPiece(row, p2, 'front');
        if (col === 1)  return pickPiece(row, p2, 'middle');
        if (col === 0)  return pickPiece(row, p2, 'back');
        if (row === 2)  return pickPiece(col, p3, 'front');
        if (row === 1)  return pickPiece(col, p3, 'middle');
        if (row === 0)  return pickPiece(col, p3, 'back', true);
        if (col === 15) return pickPiece(row, p4, 'front');
        if (col === 16) return pickPiece(row, p4, 'middle');
        if (col === 17) return pickPiece(row, p4, 'back', true);

        return null;
    }

    useEffect(() => {
        // Clear en passant targets at the start of a new turn
        setBoard(b => b.map(r => r.map(c => c && c.piece?.type === "pawn" && c.piece.getPlayer().id === turn ? (((c.piece as Pawn).isEnPassantTarget = [], (c.piece as Pawn).enPassantSquare = [], c)) : c)));
        // Auto-rotate view to current player
        if (DEBUG_AUTO_ROTATE) {
            setViewRotation((turn - 1) * 90);
        }
    }, [turn]);

    useEffect(() => {
        if (isPaused) return;
        const currentIndex = turn - 1;
        const timer = setInterval(() => {
            setPlayers(prev => {
                const updated = [...prev];
                const current = updated[currentIndex];
                if (!current || current.timeRemaining <= 0) return updated;

                if (!DEBUG_TIME_DISABLED) current.timeRemaining -= 1;

                if (!DEBUG_TIME_DISABLED && current.timeRemaining <= 0) {
                    let nextTurn = (turn % 4) + 1;
                    while (updated.find(p => p.id === nextTurn)?.isDefeat) {
                    nextTurn = (nextTurn % 4) + 1;
                    }
                    current.timeRemaining = TURN_LIMIT;
                    current.moveCount = 0;
                    if (lastSelected) drawMoves(lastSelected, false);
                    setLastSelected(null);
                    setBoard(prev => prev.map(row => row.map(c => c ? { ...c, shaded:false, selected:false } : null)));
                    setTurn(nextTurn);
                }

                return updated;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [turn, isPaused]);

    useEffect(() => {
        if (isPaused) return;
        const player = players.find(p => p.id === turn);
        if (!player || !player.isCPU) return;
        const timer = setTimeout(() => {
            const legalMoves = getAIMoves(player);
            const chosen = pickAIMove(legalMoves);
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

    function readyNextTurn() {
        let nextTurn = (turn % 4) + 1;
        if (DEBUG_FROZEN_ARMY) {
            let safety = 0;
            while (players.find(p => p.id === nextTurn)?.isDefeat && safety < 4) {
                nextTurn = (nextTurn % 4) + 1;
                safety++;
            }
        }
        setPlayers(prev => {
            const updated = [...prev];
            const current = updated.find(p => p.id === turn);
            if (current) current.timeRemaining = TURN_LIMIT;
            if (current) current.moveCount = 0;
            setCPUMove(null);
            return updated;
        });

        setTurn(nextTurn);
    }

    const onCellPress = throttle((row: number, col: number) => {
        if (isPaused) return;
        if (!isPanOrPinchActive) {
            const cell = board[row]?.[col];
            const piece = cell?.piece;
            const player = piece?.getPlayer();
            if (!cell) return;
            // Instantly switch turns in debug mode when tapping any piece
            if (DEBUG_IGNORE_TURNS && player?.id && player.id !== turn) {
                setTurn(player.id);
            }
            // Enforce turn order.
            if (!DEBUG_IGNORE_TURNS) {
                if (!lastSelected) {
                    if (!piece || !player) return;
                    if (player.id !== turn) return;
                    if (DEBUG_FROZEN_ARMY && player.isDefeat) return;
                }
            }
            // If nothing is selected yet.
            if (!lastSelected) {
                if (!piece || !player) return;
                if (!DEBUG_IGNORE_TURNS && player.id !== turn) return;
                if (DEBUG_FROZEN_ARMY && player.isDefeat) return;
                if (player.getPieces().some(p => p.onlyChoice) && !piece.onlyChoice) return;
                cell.selected = true;
                setLastSelected(cell);
                drawMoves(cell, true);
                return;
            }
            // Deselecting the currently selected cell.
            if (lastSelected.index.x === cell.index.x && lastSelected.index.y === cell.index.y) {
                lastSelected.selected = false;
                drawMoves(lastSelected, false);
                setLastSelected(null);
                return;
            }
            // Switching or moving from the currently selected cell.
            if (cell.piece && cell.piece.getPlayer() === lastSelected.piece?.getPlayer()) {
                lastSelected.selected = false;
                drawMoves(lastSelected, false);
                cell.selected = true;
                setLastSelected(cell);
                drawMoves(cell, true);
                return;
            }
            // Moving to a shaded cell.
            if (cell.shaded) {
                const p = lastSelected.piece?.getPlayer();
                drawMoves(lastSelected, false);
                doMove(cell);
                if (!DEBUG_IGNORE_TURNS) {
                    if (p && p.moveCount === 1) {
                        const hasPawns = p.getPieces().some(p => p && p.type === "pawn");
                        if (!hasPawns) {
                            readyNextTurn();
                            return;
                        }
                    }
                    if (p && p.moveCount > 1) {
                        readyNextTurn();
                    }
                }
                return;
            }
        }
    }, 0);

    function doMove(cell: CellStateProps) {
        if (!lastSelected?.piece) return;
        const movingPiece = lastSelected.piece;
        const targetPiece = cell.piece;
        const player = movingPiece.getPlayer();
        const enemyPlayer = targetPiece?.getPlayer();
        // Block moves that capture a king
        if (targetPiece && targetPiece.type === "king" && !(targetPiece as King).dead) return;
        const from = lastSelected.index;
        const to = cell.index;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // En passant captures
        if (movingPiece.type === "pawn") {
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1 && !cell.piece) {
                const cand1 = board[from.y]?.[to.x];
                const cand2 = board[to.y]?.[from.x];
                const candidates = [cand1, cand2];
                for (const cand of candidates) {
                    const epPawn = cand?.piece as Pawn | undefined;
                    if (!epPawn || epPawn.type !== "pawn" || epPawn.getPlayer() === player) continue;

                    for (let i = 0; i < epPawn.isEnPassantTarget.length; i++) {
                        const sq = epPawn.enPassantSquare[i];
                        if (epPawn.isEnPassantTarget[i] && sq && sq.x === to.x && sq.y === to.y) {
                            cand!.piece = null;
                            epPawn.getPlayer().removePiece(epPawn);
                            player.addCapturedPiece(epPawn.type);
                            setPlayers([...players]);
                            break;
                        }
                    }
                }
            }
        }
        // Set en passant target
        if (movingPiece.type === "pawn") {
            const pawn = movingPiece as Pawn;
            const [fx, fy] = PAWN_FORWARD[pawn.getPlayer().id];
            const isDoubleStep = dx === 2 * fx && dy === 2 * fy;
            if (isDoubleStep) {
                pawn.isEnPassantTarget.push(true);
                pawn.enPassantSquare.push({ x: from.x + fx, y: from.y + fy });
                // keep arrays at max length 2
                if (pawn.isEnPassantTarget.length > 2) pawn.isEnPassantTarget.shift();
                if (pawn.enPassantSquare.length > 2) pawn.enPassantSquare.shift();

            } else {
                pawn.isEnPassantTarget.push(false);
                pawn.enPassantSquare.push(null);
                // keep arrays synced in length
                if (pawn.isEnPassantTarget.length > 2) pawn.isEnPassantTarget.shift();
                if (pawn.enPassantSquare.length > 2) pawn.enPassantSquare.shift();
            }
        }
        // Remove captured piece from player's pieces
        if (targetPiece && enemyPlayer) {
            enemyPlayer.removePiece(targetPiece);
            player.addCapturedPiece(targetPiece.type);
            setPlayers([...players]);
        }
        // Castling move for king
        if (movingPiece.type === "king" && (Math.abs(to.x - from.x) === 2 || Math.abs(to.y - from.y) === 2)) {
            const [fx, fy] = [Math.sign(to.x - from.x), Math.sign(to.y - from.y)];
            const rooks = player.getPieces().filter(p => p?.type === "rook" && !(p as Rook).hasMoved);
            let rook: Rook | undefined;
            if (fx !== 0) {
                rook = rooks.find(r => r.index.y === to.y && Math.sign(r.index.x - from.x) === fx) as Rook;
            } else if (fy !== 0) {
                rook = rooks.find(r => r.index.x === to.x && Math.sign(r.index.y - from.y) === fy) as Rook;
            }
            if (!rook) return;
            if (fx !== 0) {
                const step = Math.sign(rook.index.x - to.x);
                const newX = to.x - step;
                const targetCell = board[to.y]?.[newX];
                const rookCell = board[rook.index.y]?.[rook.index.x];
                if (targetCell && rookCell) {
                    targetCell.piece = rook;
                    rookCell.piece = null;
                    rook.index = { x: newX, y: to.y };
                }
            } else if (fy !== 0) {
                const step = Math.sign(rook.index.y - to.y);
                const newY = to.y - step;
                const targetCell = board[newY]?.[to.x];
                const rookCell = board[rook.index.y]?.[rook.index.x];
                if (targetCell && rookCell) {
                    targetCell.piece = rook;
                    rookCell.piece = null;
                    rook.index = { x: to.x, y: newY };
                }
            }
            rook.hasMoved = true
        }
        // Mark pawn/rook/king as moved
        if ("hasMoved" in movingPiece && !movingPiece.hasMoved) {
            (movingPiece as { hasMoved: boolean }).hasMoved = true;
        }
        // Log the move
        const columns = 'abcdefghijklmnopqr';
        const targetNote = targetPiece ? ('x' + targetPiece.note) : '-';
        const moveNotation = `${movingPiece.note}${columns[from.x]}${gridSize - from.y}${targetNote}${columns[to.x]}${gridSize - to.y}`;
        player.lastMove = moveNotation;
        player.moveCount += 1;
        // Move the piece
        movingPiece.index = { ...cell.index };
        cell.piece = movingPiece;
        lastSelected.piece = null;
        setLastSelected(null);
        // Pawn promotion on reaching side rows or back rows.
        if (movingPiece.type === "pawn") {
            const player = movingPiece.getPlayer();
            const { x, y } = movingPiece.index;
            let sideHit = false;
            if (player.id === 1 && y === 5  && (x < 5 || x > 12)) sideHit = true;
            if (player.id === 2 && x === 12 && (y < 5 || y > 12)) sideHit = true;
            if (player.id === 3 && y === 12 && (x < 5 || x > 12)) sideHit = true;
            if (player.id === 4 && x === 5  && (y < 5 || y > 12)) sideHit = true;
            const backlineHit: Record<number, () => boolean> = {1: () => y <= 0, 2: () => x >= 17, 3: () => y >= 17, 4: () => x <= 0};
            if (backlineHit[player.id]()) cell.piece = new Queen({ x, y }, player); // Promote to queen for now, implement choice later.
            if (sideHit) cell.piece = new Prince({ x, y }, player);
        }
        // Check for king check status
        updateCheckStates(board);
        // Check for checkmate
        for (const player of players) {
            inCheckmate(board, player);
        }
        // Update the board state
        setBoard([...board.map(row => [...row])]);
    }

    function drawMoves(cell: CellStateProps, shouldShade: boolean) {
        const localCells = board.map(row => [...row]);
        cell.shaded = shouldShade;
        if (!cell?.piece) return;
        const piece = cell.piece;
        const lastPawn = getLastPawn(piece.getPlayer());
        const lastNonPawn = getLastNonPawn(piece.getPlayer());
        if (piece.type !== "pawn" && lastNonPawn) return;
        if (lastPawn && lastPawn.x === piece.index.x && lastPawn.y === piece.index.y) return;
        if (piece.type === "king" && (piece as King).dead) return;
        const moves = piece.getRawMoves(localCells);
        const enemies = players.filter(p => p !== piece.getPlayer());
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
                if (isForward || isAttackTarget) {
                    targetCell.shaded = shouldShade;
                }
                continue;
            }
            // Special handling for king moves (castling)
            if (piece.type === "king") {
                const dx = Math.abs(move.x - piece.index.x);
                const dy = Math.abs(move.y - piece.index.y);
                const isCastleMove = dx === 2 || dy === 2;
                if (isCastleMove) {
                    targetCell.shaded = shouldShade;
                }
                continue;
            }
            targetCell.shaded = shouldShade;
        }
    }

    function getLastPawn(player: Player): Coord | null {
        if (player.moveCount !== 1) return null;
        const m = player.lastMove;
        if (!m) return null;
        const firstChar = m[0];
        if (firstChar !== firstChar.toLowerCase()) return null;
        const columns = 'abcdefghijklmnopqr';
        let destPart: string | null = null;
        if (m.includes('x')) {
            const parts = m.split('x');
            if (parts.length === 2) destPart = parts[1];
        } else if (m.includes('-')) {
            const parts = m.split('-');
            if (parts.length === 2) destPart = parts[1];
        }
        if (!destPart) return null;
        const file = destPart[0];
        const rank = parseInt(destPart.slice(1));
        const x = columns.indexOf(file);
        const y = gridSize - rank;
        return { x, y };
    }

    function getLastNonPawn(player: Player): boolean {
        if (player.moveCount !== 1) return false
        const m = player.lastMove
        if (!m) return false
        return m[0] !== m[0].toLowerCase();
    }

    function updateCheckStates(board: Cells[][]) {
        for (const player of players) {
            const playerPieces = player.getPieces();
            const king = playerPieces.find(p => p && p.type === "king" && !(p as King).dead) as King | undefined;
            if (!king) continue;
            const enemies = players.filter(p => p !== player && !p.isDefeat);
            const inCheck = isCellAttackable(board, king.index, enemies);
            if (!inCheck) {
                playerPieces.forEach(p => p.onlyChoice = false);
            }
            king.checked = inCheck;
        }
    }

    function inCheckmate(board: Cells[][], player: Player) {
        const playerPieces = player.getPieces();
        const king = playerPieces.find(p => p && p.type === "king") as King | undefined;
        if (!king) return;
        if (!king.checked) return;
        let hasEscape = false;
        const enemies = players.filter(p => p !== player && !p.isDefeat);
        for (const piece of playerPieces) {
            if (!piece || (piece.type === "king" && (piece as King).dead)) continue;
            piece.onlyChoice = false;
            const moves = piece.getRawMoves(board);
            for (const move of moves) {
                const simulated = simulateMove(board, piece, move);
                const kingAfter = findKing(simulated, player);
                if (!kingAfter) continue;
                const stillInCheck = isCellAttackable(simulated, kingAfter.index, enemies)
                if (!stillInCheck) {
                    piece.onlyChoice = true;
                    hasEscape = true;
                }
            }
        }
        // Mark king as dead
        if (!hasEscape) {
            const { x, y } = king.index
            const cell = board[y]?.[x]
            if (cell?.piece) {
                (cell.piece as King).dead = true;
                (cell.piece as King).checked = false;
                if (DEBUG_FROZEN_ARMY) {
                    player.isDefeat = true
                }
            }
        }
        return;
    }

    function simulateMove(board: Cells[][], piece: Pieces, move: Coord): Cells[][] {
        if (!piece) return board;

        const clone = board.map((row, y) => row.map((cell, x) => cell ? { ...cell, piece: cell.piece ? Object.assign(Object.create(Object.getPrototypeOf(cell.piece)), cell.piece) : null}: null));

        const from = piece.index;
        if (!clone[from.y] || !clone[from.y][from.x]) return clone;
        if (!clone[move.y] || !clone[move.y][move.x]) return clone;
        const movingCell = clone[from.y][from.x];
        const targetCell = clone[move.y][move.x];
        if (!movingCell || !targetCell) return clone;

        // Handle en passant capture edgecase
        if (piece.type === "pawn") {
            const dx = move.x - from.x;
            const dy = move.y - from.y;
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1 && !targetCell.piece) {
                const cand1 = clone[from.y]?.[move.x];
                const cand2 = clone[move.y]?.[from.x];
                const candidates = [cand1, cand2];
                for (const cand of candidates) {
                    const epPawn = cand?.piece as Pawn | undefined;
                    if (!epPawn || epPawn.type !== "pawn" || epPawn.getPlayer() === piece.getPlayer()) continue;
                    for (let i = 0; i < epPawn.isEnPassantTarget.length; i++) {
                        const sq = epPawn.enPassantSquare[i];
                        if (epPawn.isEnPassantTarget[i] && sq && sq.x === move.x && sq.y === move.y) {
                            cand!.piece = null;
                            break;
                        }
                    }
                }
            }
        }

        targetCell.piece = movingCell.piece;
        movingCell.piece = null;
        if (!targetCell.piece) {
            return clone;
        }
        targetCell.piece!.index = { ...move };

        for (let y = 0; y < clone.length; y++) {
            for (let x = 0; x < clone[y].length; x++) {
                const c = clone[y][x];
                if (c && c.piece) {
                    c.piece.index = { x, y };
                }
            }
        }

        return clone;
    }

    function findKing(board: Cells[][], player: Player): Pieces {
        for (const row of board) {
            for (const cell of row) {
                if (cell?.piece?.type === "king" && cell.piece.getPlayer() === player) {
                    return cell.piece;
                }
            }
        }
        return null;
    }

    function isCellAttackable(board: Cells[][], coord: Coord, byPlayers: Player[]): boolean {
        for (const row of board) {
            for (const cell of row) {
                const piece = cell?.piece;
                if (!piece) continue;
                if (piece.type === "king" && (piece as King).dead) continue;
                if (!byPlayers.includes(piece.getPlayer())) continue;
                const attacks = piece.getRawAttacks(board);
                if (attacks.some(a => a.x === coord.x && a.y === coord.y)) {
                    return true;
                }
            }
        }
        return false;
    }

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
        let bestScore = -1000000;
        let best: LegalMove[] = [];

        for (const m of moves) {
            const score = evaluateAIMove(m);
            if (score > bestScore) {
                bestScore = score;
                best = [m];
            } else if (score === bestScore) {
                best.push(m);
            }
        }
        return best[Math.floor(Math.random() * best.length)];
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
        for (const ally of players) {
            if (ally !== player) continue;
            for (const ap of ally.getPieces()) {
                if (!ap || ap === piece) continue;
                const attacks = ap.getRawAttacks(boardAfter);
                if (attacks.some(a => a.x === to.x && a.y === to.y)) {
                    defenderCount++;
                    const v = PIECE_POINTS[ap.type];
                    if (v > strongestDefender) strongestDefender = v;
                }
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

        // Check and checkmate evaluation
        let checkState = 0;
        for (const enemy of enemies) {
            const enemyKing = findKing(boardAfter, enemy);
            if (!enemyKing) continue;
            const givesCheck = isCellAttackable(boardAfter, enemyKing.index, [player]);
            if (!givesCheck) continue;
            checkState = Math.max(checkState, 1);
            let enemyHasEscape = false;
            const enemyPieces = enemy.getPieces();
            for (const eP of enemyPieces) {
                if (!eP || (eP.type === "king" && (eP as King).dead)) continue;
                const moves = eP.getRawMoves(boardAfter);
                for (const m of moves) {
                    const simulated = simulateMove(boardAfter, eP, m);
                    const kingAfter = findKing(simulated, enemy);
                    if (!kingAfter) continue;
                    const stillInCheck = isCellAttackable(simulated, kingAfter.index, [player]);
                    if (!stillInCheck) {
                        enemyHasEscape = true;
                        break;
                    }
                }
                if (enemyHasEscape) break;
            }
            if (!enemyHasEscape) {
                checkState = 2;
                break;
            }
        }
        if (checkState === 1) score += 8;
        if (checkState === 2) score += 1000;

        // Avoid moves that put own king in danger
        const ownKing = findKing(boardAfter, player);
        if (ownKing && isCellAttackable(boardAfter, ownKing.index, enemies)) {
            return -1000000;
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
            let leftHome = false;
            switch (player.id) {
                case 1:
                    if (from.y >= 14 && to.y < 14) leftHome = true;
                    break;
                case 2:
                    if (from.x <= 3 && to.x > 3) leftHome = true;
                    break;
                case 3:
                    if (from.y <= 3 && to.y > 3) leftHome = true;
                    break;
                case 4:
                    if (from.x >= 14 && to.x < 14) leftHome = true;
                    break;
            }
            if (leftHome) score += 20;
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
                score -= 50;
            }
        }

        // Slightly discourage pointless pawn moves
        if (piece.type === "pawn" && !move.isCapture) {
            score -= 1;
        }

        return score;
    }

    const hookStyles = useMemo(() => StyleSheet.create({
        board: {
            width: boardSize,
            height: boardSize,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyCell: {
            width: cellSize,
            height: cellSize,
            backgroundColor: 'transparent',
        },
    }), [boardSize, cellSize]);

    const settingsPanelSize = useMemo(() => {
        const t = Math.min(Math.max(((14 * cellSize) - 400) / (800 - 400), 0), 1);
        return (14 * cellSize) + ((8 * cellSize) - (14 * cellSize)) * t;
    }, [boardSize, cellSize]);

    return (
        <NavigationProvider navigation={navigation}>
            <View style={[styles.container, { flexDirection: isPortrait ? 'column' : 'row' }]}>
                <View style={{ width: isPortrait ? '100%' : overlaySize, height: isPortrait ? overlaySize : '100%' }}>
                    {isPortrait ? <TurnIndicator player={currentPlayer} isPaused={isPaused} showTimer={!DEBUG_TIME_DISABLED} viewRotation={viewRotation} setIsPaused={setIsPaused} setSettingsModal={setSettingsModal} skipTurn={readyNextTurn} /> : <MoveHistory />}
                </View>
                <View style={[styles.boardWrapper, { zIndex: 2 }]}>
                    <Zoomable style={hookStyles.board} setPanOrPinchActive={setPanOrPinchActive}>
                        {board.map((row, x) => (
                            <View key={`row-${x}`} style={styles.row}>
                                {row.map((cellState, y) =>
                                    cellState ? (<Cell key={`${x}-${y}`} onCellPress={() => onCellPress(x, y)} player={currentPlayer} viewRotation={viewRotation} {...cellState} />) : <View key={`${x}-${y}`} style={hookStyles.emptyCell} />
                                )}
                            </View>
                        ))}
                        <PlayerUI players={players} viewRotation={viewRotation} setViewRotation={setViewRotation} />
                        <View style={{
                            position: 'absolute',
                            left: 8 * cellSize,
                            top: 8 * cellSize,
                            width: 2 * cellSize,
                            height: 2 * cellSize,
                            borderWidth: cellSize / 8,
                            borderColor: 'rgba(0, 0, 0, 1)',
                            zIndex: 11,
                            pointerEvents: 'none',
                        }}/>
                    </Zoomable>
                </View>
                <View style={{ width: isPortrait ? '100%' : overlaySize, height: isPortrait ? overlaySize : '100%' }}>
                    {isPortrait ? <MoveHistory /> : <TurnIndicator player={currentPlayer} isPaused={isPaused} showTimer={!DEBUG_TIME_DISABLED} viewRotation={viewRotation} setIsPaused={setIsPaused} setSettingsModal={setSettingsModal} skipTurn={readyNextTurn} />}
                </View>
                <Modal visible={isPaused} transparent={true} animationType='none'>
                    <TouchableWithoutFeedback onPress={() => setIsPaused(false)}>
                        <View style={{ position: 'absolute', width: visibleWidth, height: usableHeight, zIndex: 4 }} />
                    </TouchableWithoutFeedback>
                    <View style={{ width: visibleWidth, height: usableHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 5, pointerEvents: 'box-none' }}/>
                </Modal>
                <Modal visible={settingsModal} transparent={true} animationType='none'>
                    <TouchableWithoutFeedback onPress={() => setSettingsModal(false)}>
                        <View style={{ position: 'absolute', width: visibleWidth, height: usableHeight, zIndex: 4 }} />
                    </TouchableWithoutFeedback>
                    <View style={{ width: visibleWidth, height: usableHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 5, pointerEvents: 'box-none' }}>
                        <View style={{ width: settingsPanelSize, height: settingsPanelSize, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', borderRadius: cellSize / 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Checkbox value={isChecked['test']} color={isChecked ? 'grey' : undefined} onValueChange={() => setIsChecked(prev => ({...prev, test: !prev['test']}))} />
                                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ color: 'white', fontFamily: 'ComicSansMS', fontSize: scaleText(12), marginLeft: scaleText(8) }}>Test Checkbox</Text>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </NavigationProvider>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'flex-start', 
        alignItems: 'center', 
        backgroundColor: '#b59669ff', 
        overflow: 'visible',
    },
    boardWrapper: {
        overflow: 'visible',
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row'
    },
});