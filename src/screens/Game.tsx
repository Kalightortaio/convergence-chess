import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cells, CellStateProps, Coord, Pieces, RootStackParamList } from '../Types';
import { PAWN_FORWARD } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { Pawn, Scout, Rook, Knight, Bishop, Queen, King } from "../core/pieces";
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationProvider } from '../components/NavigationProvider';
import PlayerUI from '../components/PlayerUI';
import { Player } from '../core/Player';
import TurnIndicator from '../components/TurnIndicator';
import { useDimensions } from "../hooks/useDimensions";
import MoveHistory from '../components/MoveHistory';


type GameProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Game'>;
};

export default function Game({ navigation }: GameProps) {
    const { cellSize, boardSize, gridSize, isPortrait } = useDimensions();
    // Temp until Lobby is made
    // Todo: Allow players to choose their colors in the lobby. Names and profile pics should be fetched from their profiles, and can be changed on the fly.
    const [players, setPlayers] = useState<Player[]>(() => [
        new Player(1, "Red", "Novice", "#800000", "#FF0000", {uri: "https://randomuser.me/api/portraits/men/42.jpg"}, "botRight"),
        new Player(2, "Blue", "Adept", "#0000FF", "#87CEEB", {uri: "https://randomuser.me/api/portraits/women/0.jpg"}, "botLeft"),
        new Player(3, "Green", "Comeback Kid", "#006400", "#00FF7F", {uri: "https://randomuser.me/api/portraits/men/16.jpg"}, "topLeft"),
        new Player(4, "Yellow", "Grandmaster", "#B8860B", "#FFD700", {uri: "https://randomuser.me/api/portraits/women/7.jpg"}, "topRight"),
    ]);

    const [turn, setTurn] = useState<number>(1);
    const [board, setBoard] = useState<Cells[][]>(() => initBoard());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);
    const [lastSelected, setLastSelected] = useState<CellStateProps | null>(null);
    const DEBUG_IGNORE_TURNS = true; // It would cool if git could skip committing this line every time I toggle it. Alas, it cannot.
    const DEBUG_LOCAL_MULTI = true; // Allow multiple players on the same device for testing. Will eventually be a lobby feature.
    const DEBUG_FROZEN_ARMY = true; // When your checkmated, you lose control of your pieces but they remain on the board. Will eventually be a lobby feature.
    const currentPlayer = players.find(p => p.id === turn);
    const [viewRotation, setViewRotation] = useState(0)

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
            middle: ['pawn', 'scout', 'knight', 'bishop', 'bishop', 'knight', 'scout', 'pawn'],
            back: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        } as const;

        const pickPiece = (index: number, player: Player, rank: keyof typeof layouts, flipped = false) => {
            const localIndex = index - 5;
            const order = flipped ? [...layouts[rank]].reverse() : layouts[rank];
            const type = order[localIndex % order.length];
            const position = { x: col, y: row };

            switch (type) {
                case "pawn":   
                    return new Pawn(position, player);
                case "scout":  
                    return new Scout(position, player);
                case "rook":   
                    return new Rook(position, player);
                case "knight": 
                    return new Knight(position, player);
                case "bishop": 
                    return new Bishop(position, player);
                case "queen":  
                    return new Queen(position, player);
                case "king":   
                    return new King(position, player);
                default:       
                    return null;
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
        const updatedBoard = board.map(row =>
            row.map(cell => {
            if (!cell) return null;

            const clearedCell = { ...cell, shaded: false, selected: false };

            const piece = clearedCell.piece;
            if (piece?.type === "pawn" && piece.getPlayer().id === turn) {
                const pawn = piece as Pawn;
                if (pawn.isEnPassantTarget) pawn.isEnPassantTarget = false;
            }

            return clearedCell;
            })
        );

        setBoard(updatedBoard);
    }, [turn]);

    const onCellPress = throttle((row: number, col: number) => {
        if (!isPanOrPinchActive) {
            const cell = board[row]?.[col];
            const piece = cell?.piece;
            const player = piece?.getPlayer();
            if (!cell) return;
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
                drawMoves(lastSelected, false);
                doMove(cell);
                if (!DEBUG_IGNORE_TURNS) {
                    let nextTurn = (turn % 4) + 1;
                    if (DEBUG_FROZEN_ARMY) {
                        let safety = 0;
                        while (players.find(p => p.id === nextTurn)?.isDefeat && safety < 4) {
                            nextTurn = (nextTurn % 4) + 1;
                            safety++;
                        }
                    }
                    setTurn(nextTurn);
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
        if (targetPiece && targetPiece.type === "king") return;
        const from = lastSelected.index;
        const to = cell.index;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // En passant capture
        if (movingPiece.type === "pawn") {
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1 && !cell.piece) {
                const [fx, fy] = PAWN_FORWARD[player.id];
                const capturedX = to.x - fx;
                const capturedY = to.y - fy;
                const capturedCell = board[capturedY]?.[capturedX];
                const capturedPiece = capturedCell?.piece;
                if (capturedPiece?.type === "pawn" && (capturedPiece as Pawn).isEnPassantTarget) {
                    capturedCell!.piece = null;
                    capturedPiece.getPlayer().removePiece(capturedPiece);
                    player.addCapturedPiece(capturedPiece.type);
                    setPlayers([...players]);
                }
            }
        }
        // Set en passant target
        if (movingPiece.type === "pawn") {
            const pawn = movingPiece as Pawn;
            if (!pawn.hasMoved) {
                const [fx, fy] = PAWN_FORWARD[pawn.getPlayer().id];
                const isDoubleStep = dx === 2 * fx && dy === 2 * fy;
                if (isDoubleStep) {
                    pawn.isEnPassantTarget = true;
                }
            }
        }
        // Remove captured piece from player's pieces
        if (targetPiece && enemyPlayer) {
            enemyPlayer.removePiece(targetPiece);
            if (targetPiece.type === "dead_king") {
                // Give the capturing player a captured king for scoring purposes
                player.addCapturedPiece("king");
            } else {
                player.addCapturedPiece(targetPiece.type);
            }
            setPlayers([...players]);
        }
        // Castling move for king
        if (movingPiece.type === "king" && Math.abs(to.x - from.x) === 2 || Math.abs(to.y - from.y) === 2) {
            const rooks = player.getPieces().filter(p => p?.type === "rook" && !(p as Rook).hasMoved);
            for (const rook of rooks) {
                if (player.id % 2 && rook.index.y === to.y) {
                    const step = Math.sign(rook.index.x - to.x)
                    const newX = to.x - step
                    const targetCell = board[to.y]?.[newX]
                    const rookCell = board[rook.index.y]?.[rook.index.x]
                     if (!targetCell || !rookCell) continue
                    targetCell.piece = rook
                    rookCell.piece = null
                    rook.index = { x: newX, y: to.y }
                } else if (!(player.id % 2) && rook.index.x === to.x) {
                    const step = Math.sign(rook.index.y - to.y)
                    const newY = to.y - step
                    const targetCell = board[newY]?.[to.x]
                    const rookCell = board[rook.index.y]?.[rook.index.x]
                    if (!targetCell || !rookCell) continue
                    targetCell.piece = rook
                    rookCell.piece = null
                    rook.index = { x: to.x, y: newY }
                }
                (rook as Rook).hasMoved = true
            }
        }
        // Mark pawn/rook/king as moved
        if ("hasMoved" in movingPiece && !movingPiece.hasMoved) {
            (movingPiece as { hasMoved: boolean }).hasMoved = true;
        }
        // Move the piece
        movingPiece.index = { ...cell.index };
        cell.piece = movingPiece;
        lastSelected.piece = null;
        setLastSelected(null);
        // Pawn promotion on reaching side rows or back rows.
        if (movingPiece.type === "pawn") {
            const player = movingPiece.getPlayer();
            const { x, y } = movingPiece.index;
            const sideHit = player.id % 2 ? (x <= 2 || x >= 15) : (y <= 2 || y >= 15);
            const backlineHit: Record<number, () => boolean> = {1: () => y <= 2, 2: () => x >= 15, 3: () => y >= 15, 4: () => x <= 2};
            if (backlineHit[player.id]()) cell.piece = new Queen({ x, y }, player); // Promote to queen for now, implement choice later.
            if (sideHit) cell.piece = new Scout({ x, y }, player);
        }
        // Check for king check status
        updateCheckStates(board);
        // Check for checkmate
        for (const player of players) {
            inCheckmate(board, player);
        }
        // Clear other pawns' en passant targets
        if (movingPiece.type === "pawn") {
            for (const p of movingPiece.getPlayer().pieces) {
                if (p !== movingPiece && p instanceof Pawn) p.isEnPassantTarget = false;
            }
        }
        // Update the board state
        setBoard([...board.map(row => [...row])]);
    }

    function drawMoves(cell: CellStateProps, shouldShade: boolean) {
        const localCells = board.map(row => [...row]);
        cell.shaded = shouldShade;
        if (!cell?.piece) return;
        const piece = cell.piece;
        if (piece.type === "dead_king") return;
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
            } else {
                targetCell.shaded = shouldShade;
            }
        }
    }

    function updateCheckStates(board: Cells[][]) {
        for (const player of players) {
            const playerPieces = player.getPieces();
            const king = playerPieces.find(p => p && p.type === "king") as King | undefined;
            if (!king) continue;

            const enemies = players.filter(p => p !== player);
            const inCheck = isCellAttackable(board, king.index, enemies);
            king.checked = inCheck;
        }
    }

    function inCheckmate(board: Cells[][], player: Player) {
        const playerPieces = player.getPieces();
        const king = playerPieces.find(p => p && p.type === "king") as King | undefined;
        if (!king) return;
        if (!king.checked) return;

        const enemies = players.filter(p => p !== player);
        for (const piece of playerPieces) {
            if (!piece || piece.type === "dead_king") continue;
            const moves = piece.getRawMoves(board);
            for (const move of moves) {
                const simulated = simulateMove(board, piece, move);
                const kingAfter = findKing(simulated, player);
                if (!kingAfter) continue;

                const stillInCheck = isCellAttackable(simulated, kingAfter.index, enemies);
                if (!stillInCheck) {
                    return;
                }
            }
        }
        // Mark king as dead
        const { x, y } = king.index;
        const cell = board[y]?.[x];
        if (cell?.piece) {
            cell.piece.type = "dead_king";
            if (DEBUG_FROZEN_ARMY) {
                player.isDefeat = true;
            }
        }
        return;
    }

    function simulateMove(board: Cells[][], piece: Pieces, move: Coord): Cells[][] {
        if (!piece) return board;
        const clone = board.map(row => row.map(cell => cell ? { ...cell, piece: cell.piece ? Object.assign(Object.create(Object.getPrototypeOf(cell.piece)), cell.piece) : null}: null));

        const from = piece.index;
        const movingCell = clone[from.y][from.x];
        const targetCell = clone[move.y][move.x];
        if (!movingCell || !targetCell) return clone;

        targetCell.piece = movingCell.piece;
        targetCell.piece!.index = { ...move };
        movingCell.piece = null;
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
                if (piece.type === "dead_king") continue;
                if (!byPlayers.includes(piece.getPlayer())) continue;
                const attacks = piece.getRawAttacks(board);
                if (attacks.some(a => a.x === coord.x && a.y === coord.y)) {
                    return true;
                }
            }
        }
        return false;
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

    return (
        <NavigationProvider navigation={navigation}>
            <View style={[styles.container, { flexDirection: isPortrait ? 'column' : 'row' }]}>
                <View style={styles.sideDisplay}>
                    <TurnIndicator player={currentPlayer} leftOverlay={isPortrait}/>
                </View>
                <View style={[styles.boardWrapper, { zIndex: 2, elevation: 2 }]}>
                    <Zoomable style={hookStyles.board} setPanOrPinchActive={setPanOrPinchActive}>
                        {board.map((row, x) => (
                            <View key={`row-${x}`} style={styles.row}>
                                {row.map((cellState, y) =>
                                    cellState ? (<Cell key={`${x}-${y}`} onCellPress={() => onCellPress(x, y)} selectedColor={lastSelected?.piece?.getPlayer().rightColor} viewRotation={viewRotation} {...cellState} />) : <View key={`${x}-${y}`} style={hookStyles.emptyCell} />
                                )}
                            </View>
                        ))}
                        <PlayerUI players={players} viewRotation={viewRotation} setViewRotation={setViewRotation} />
                    </Zoomable>
                </View>
                <View style={styles.sideDisplay}>
                    <MoveHistory rightOverlay={isPortrait}/>
                </View>
            </View>
        </NavigationProvider>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#b59669ff', 
        overflow: 'visible',
    },
    boardWrapper: {
        overflow: 'visible',
        alignSelf: 'center',
    },
    sideDisplay: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    row: {
        flexDirection: 'row'
    },
});