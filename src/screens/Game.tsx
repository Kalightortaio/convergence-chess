import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Cells, CellStateProps, Coord, Pieces, RootStackParamList } from '../Types'
import { cellSize, gridSize, PAWN_FORWARD, scaleText } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { Pawn, Scout, Rook, Knight, Bishop, Queen, King } from "../core/pieces";
import { StackNavigationProp } from '@react-navigation/stack';
import { NavigationProvider } from '../components/NavigationProvider';

type GameProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Game'>;
};

export default function Game({ navigation }: GameProps) {
    const [turn, setTurn] = useState<number>(1);
    const playerPiecesRef = useRef<Record<number, Pieces[]>>({1:[], 2:[], 3:[], 4:[]});
    const [board, setBoard] = useState<Cells[][]>(() => initBoard());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);
    const [lastSelected, setLastSelected] = useState<CellStateProps | null>(null);
    const DEBUG_IGNORE_TURNS = true;

    function initBoard(): Cells[][] {
        const initialCells: Cells[][] = [];
        const piecesByPlayer: Record<number, Pieces[]> = {1:[], 2:[], 3:[], 4:[]};
        for (let row = 0; row < gridSize; row++) {
            const currentRow: Cells[] = [];
            for (let col = 0; col < gridSize; col++) {
                const inCenter = col >= 5 && col <= 12 && row >= 5 && row <= 12;
                const inHorizontalArm = row >= 5 && row <= 12;
                const inVerticalArm = col >= 5 && col <= 12;
                if (inCenter || inHorizontalArm || inVerticalArm) {
                    const cellPiece = getStartingPieces(row, col);
                    if (cellPiece) piecesByPlayer[cellPiece.player].push(cellPiece);    
                    currentRow.push({
                        index: { x: col, y: row },
                        piece: cellPiece,
                        selected: false,
                        shaded: false,
                    });
                } else {
                    currentRow.push(null)
                }
            }
            initialCells.push(currentRow);
        }
        playerPiecesRef.current = piecesByPlayer;
        return initialCells;
    }

    function getStartingPieces(row: number, col: number): Pieces {
        const layouts = {
            front: Array(8).fill('pawn'),
            middle: ['pawn', 'scout', 'knight', 'bishop', 'bishop', 'knight', 'scout', 'pawn'],
            back: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        } as const;

        const pickPiece = (index: number, player: number, rank: keyof typeof layouts) => {
            const localIndex = index - 5;
            const order = layouts[rank];
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

        // Player 1 (Bottom)
        if (row === 15) return pickPiece(col, 1, 'front');
        if (row === 16) return pickPiece(col, 1, 'middle');
        if (row === 17) return pickPiece(col, 1, 'back');
        // Player 2 (Left)
        if (col === 2) return pickPiece(row, 2, 'front');
        if (col === 1) return pickPiece(row, 2, 'middle');
        if (col === 0) return pickPiece(row, 2, 'back');
        // Player 3 (Top)
        if (row === 2) return pickPiece(col, 3, 'front');
        if (row === 1) return pickPiece(col, 3, 'middle');
        if (row === 0) return pickPiece(col, 3, 'back');
        // Player 4 (Right)
        if (col === 15) return pickPiece(row, 4, 'front');
        if (col === 16) return pickPiece(row, 4, 'middle');
        if (col === 17) return pickPiece(row, 4, 'back');
        // Debug (Middle)
        if (row === 9 && col === 6) return new Bishop({ x: col, y: row }, 1);
        if (row === 6 && col === 9) return new Rook({ x: col, y: row }, 1);
        if (row === 11 && col === 8) return new Knight({ x: col, y: row }, 1);
        if (row === 7 && col === 7) return new King({ x: col, y: row }, 4);

        return null;
    }

    useEffect(() => {
        const updatedBoard = board.map(row =>
            row.map(cell => {
            if (!cell) return null;

            const clearedCell = { ...cell, shaded: false, selected: false };

            const piece = clearedCell.piece;
            if (piece?.type === "pawn" && piece.player === turn) {
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
            if (!cell) return;
            // Enforce turn order.
            if (!DEBUG_IGNORE_TURNS) {
                if (!lastSelected) {
                    if (!cell.piece) return;
                    if (cell.piece.player !== turn) return;
                }
            }
            // If nothing is selected yet.
            if (!lastSelected) {
                if (!cell.piece) return;      
                if (!DEBUG_IGNORE_TURNS && cell.piece.player !== turn) return;
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
            if (cell.piece && cell.piece.player === lastSelected.piece?.player) {
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
                    setTurn(prev => (prev % 4) + 1);
                }
                return;
            }
        }
    }, 0);

    function doMove(cell: CellStateProps) {
        if (!lastSelected?.piece) return;
        const movingPiece = lastSelected.piece;
        const targetPiece = cell.piece;
        // Block moves that capture a king
        if (targetPiece && targetPiece.type === "king") return;
        const from = lastSelected.index;
        const to = cell.index;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // En passant capture
        if (movingPiece.type === "pawn") {
            const pawn = movingPiece as Pawn;
            if (Math.abs(dx) === 1 && Math.abs(dy) === 1 && !cell.piece) {
                const [fx, fy] = PAWN_FORWARD[pawn.player];
                const capturedX = to.x - fx;
                const capturedY = to.y - fy;
                const capturedCell = board[capturedY]?.[capturedX];
                const capturedPiece = capturedCell?.piece;
                if (capturedPiece?.type === "pawn" && (capturedPiece as Pawn).isEnPassantTarget) {
                    capturedCell!.piece = null;
                    playerPiecesRef.current[capturedPiece.player] = playerPiecesRef.current[capturedPiece.player].filter(p => p !== capturedPiece);
                }
            }
        }
        // Set en passant target
        if (movingPiece.type === "pawn") {
            const pawn = movingPiece as Pawn;
            if (!pawn.hasMoved) {
                const [fx, fy] = PAWN_FORWARD[pawn.player];
                const isDoubleStep = dx === 2 * fx && dy === 2 * fy;
                if (isDoubleStep) {
                    pawn.isEnPassantTarget = true;
                }
            }
        }
        // Remove captured piece from player's pieces
        if (targetPiece) {
            playerPiecesRef.current[targetPiece.player] = playerPiecesRef.current[targetPiece.player].filter(p => p !== targetPiece);
        }
        // Mark pawn/rook/king as moved
        if ("hasMoved" in movingPiece && !movingPiece.hasMoved) {
            (movingPiece as { hasMoved: boolean }).hasMoved = true;
        }
        // Move the piece
        movingPiece.index = { ...cell.index };
        if (cell.piece) doAttack(cell);
        cell.piece = movingPiece;
        lastSelected.piece = null;
        setLastSelected(null);
        // Update playerPiecesRef
        if (!playerPiecesRef.current[movingPiece.player].includes(movingPiece)) {
            playerPiecesRef.current[movingPiece.player].push(movingPiece);
        }
        // Check for king check status
        updateCheckStates(board, playerPiecesRef.current);
        // Check for checkmate
        const allPlayers = [1, 2, 3, 4];
        for (const player of allPlayers) {
            inCheckmate(board, player, playerPiecesRef.current);
        }
        // Update the board state
        setBoard([...board.map(row => [...row])]);
    }

    function doAttack(cell: CellStateProps) {
        // Right now this function does nothing.
        // In the future, we will track points,
        // process Checks, update the UI, etc. 
    }

    function drawMoves(cell: CellStateProps, shouldShade: boolean) {
        const localCells = board.map(row => [...row]);
        cell.shaded = shouldShade;
        if (!cell?.piece) return;
        const piece = cell.piece;
        if (piece.type === "dead_king") return;
        const moves = piece.getRawMoves(localCells);
        const allPlayers = [1, 2, 3, 4];
        const enemies = allPlayers.filter(p => p !== piece.player);
        // Get the current king and see if it's in check
        const king = playerPiecesRef.current[piece.player].find(p => p && p.type === "king") as King | undefined;
        const isCurrentlyInCheck = !!king?.checked;
        for (const move of moves) {
            const targetCell = localCells[move.y][move.x];
            if (!targetCell) continue;
            // Check if this move would put own king in check
            const simulated = simulateMove(board, piece, move);
            const kingAfter = findKing(simulated, piece.player);
            if (!kingAfter) continue;
            const stillInCheck = isCellAttackable(simulated, kingAfter.index, enemies, playerPiecesRef.current);
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
            targetCell.shaded = shouldShade;
        }
    }

    function updateCheckStates(board: Cells[][], playerPieces: Record<number, Pieces[]>) {
        const allPlayers = [1, 2, 3, 4];

        for (const player of allPlayers) {
            const king = playerPieces[player].find(p => p && p.type === "king") as King | undefined;
            if (!king) continue;

            const enemies = allPlayers.filter(p => p !== player);

            const inCheck = isCellAttackable(board, king.index, enemies, playerPieces);
            king.checked = inCheck;
        }
    }

    function inCheckmate(board: Cells[][], player: number, playerPieces: Record<number, Pieces[]>) {
        const king = playerPieces[player].find(p => p && p.type === "king") as King | undefined;
        if (!king) return;
        if (!king.checked) return;

        const allPlayers = [1, 2, 3, 4];
        const enemies = allPlayers.filter(p => p !== player);
        for (const piece of playerPieces[player]) {
            if (!piece || piece.type === "dead_king") continue;
            const moves = piece.getRawMoves(board);
            for (const move of moves) {
                const simulated = simulateMove(board, piece, move);
                const kingAfter = findKing(simulated, player);
                if (!kingAfter) continue;

                const stillInCheck = isCellAttackable(simulated, kingAfter.index, enemies, playerPieces);
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
        }
        playerPieces[player] = playerPieces[player].map(p =>
            p && p.type === "king" ? king : p
        );
        return;
    }

    function simulateMove(board: Cells[][], piece: Pieces, move: Coord): Cells[][] {
        const clone = board.map(row => row.map(cell => cell ? { ...cell, piece: cell.piece ? Object.assign(Object.create(Object.getPrototypeOf(cell.piece)), cell.piece) : null}: null));
        if (!piece) return clone;
        const from = piece.index;
        const movingCell = clone[from.y][from.x];
        const targetCell = clone[move.y][move.x];
        if (!movingCell || !targetCell) return clone;
        // Perform the move
        targetCell.piece = movingCell.piece;
        targetCell.piece!.index = { ...move };
        movingCell.piece = null;
        return clone;
    }

    function findKing(board: Cells[][], player: number): Pieces {
        for (const row of board) {
            for (const cell of row) {
                if (cell?.piece?.type === "king" && cell.piece.player === player) {
                    return cell.piece;
                }
            }
        }
        return null;
    }

    function isCellAttackable(board: Cells[][], coord: Coord, byPlayers: number[], playerPieces: Record<number, Pieces[]>): boolean {
        for (const player of byPlayers) {
            const pieces = playerPieces[player];
            for (const piece of pieces) {
                if (!piece) continue;
                if (piece.type === "dead_king") continue;
                const attacks = piece.getRawAttacks(board);
                if (attacks.some(a => a.x === coord.x && a.y === coord.y)) {
                    return true;
                }
            }
        }
        return false;
    }

    return (
        <NavigationProvider navigation={navigation}>
            <Zoomable style={[styles.gameContainer, styles.zoomContainer]} setPanOrPinchActive={setPanOrPinchActive}>
                {board.map((row, x) => (
                    <View key={`row-${x}`} style={styles.row}>
                        {row.map((cellState, y) =>
                            cellState ? (<Cell key={`${x}-${y}`} onCellPress={() => onCellPress(x, y)} selectedColor={["maroon","blue","darkgreen","darkgoldenrod"][(lastSelected?.piece?.player ?? 1) - 1]} {...cellState} />) : <View key={`${x}-${y}`} style={styles.emptyCell} />
                        )}
                    </View>
                ))}
                <View style={[styles.corner, styles.botRight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image style={{ height: cellSize, width: cellSize }} source={{uri: 'https://reactnative.dev/img/tiny_logo.png'}} />
                        <Text style={{ fontSize: scaleText(14), fontFamily: 'ComicSansMS',color: 'maroon' }}>  Player 1</Text>
                    </View>
                </View>
                <View style={[styles.corner, styles.botLeft]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image style={{ height: cellSize, width: cellSize }} source={{uri: 'https://reactnative.dev/img/tiny_logo.png'}} />
                        <Text style={{ fontSize: scaleText(14), fontFamily: 'ComicSansMS',color: 'blue' }}>  Player 2</Text>
                    </View>
                </View>
                <View style={[styles.corner, styles.topLeft]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image style={{ height: cellSize, width: cellSize }} source={{uri: 'https://reactnative.dev/img/tiny_logo.png'}} />
                        <Text style={{ fontSize: scaleText(14), fontFamily: 'ComicSansMS',color: 'darkgreen' }}>  Player 3</Text>
                    </View>
                </View>
                <View style={[styles.corner, styles.topRight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image style={{ height: cellSize, width: cellSize }} source={{uri: 'https://reactnative.dev/img/tiny_logo.png'}} />
                        <Text style={{ fontSize: scaleText(14), fontFamily: 'ComicSansMS',color: 'darkgoldenrod' }}>  Player 4</Text>
                    </View>
                </View>
            </Zoomable>
        </NavigationProvider>
    );
}

const styles = StyleSheet.create({
    gameContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: '#BDBDBD',
    },
    zoomContainer: {
        overflow: 'hidden', 
        zIndex: 0, 
        elevation: 0,
    },
    row: {
        flexDirection: 'row'
    },
    emptyCell: {
        width: cellSize,
        height: cellSize,
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 5 * cellSize,
        height: 5 * cellSize,
        padding: cellSize / 4,
    },
    topLeft: {
        top: 0, 
        left: 0,
    },
    topRight: {
        top: 0, 
        right: 0,
    },
    botLeft: {
        bottom: 0, 
        left: 0,
    },
    botRight: {
        bottom: 0, 
        right: 0,
    },
});