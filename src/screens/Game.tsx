import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cells, CellStateProps, Pieces } from '../Types'
import { cellSize, gridSize, PAWN_FORWARD } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pawn, Scout, Rook, Knight, Bishop, Queen, King, DeadKing } from "../core/pieces";

export default function Game() {
    const [board, setBoard] = useState<Cells[][]>(initBoard());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);
    const [lastSelected, setLastSelected] = useState<CellStateProps | null>(null);
    const [turn, setTurn] = useState<number>(1);
    const DEBUG_IGNORE_TURNS = true;

    function initBoard(): Cells[][] {
        const initialCells: Cells[][] = [];
        for (let row = 0; row < gridSize; row++) {
            const currentRow: Cells[] = [];
            for (let col = 0; col < gridSize; col++) {
                const inCenter = col >= 5 && col <= 12 && row >= 5 && row <= 12;
                const inHorizontalArm = row >= 5 && row <= 12;
                const inVerticalArm = col >= 5 && col <= 12;
                if (inCenter || inHorizontalArm || inVerticalArm) {
                    const cellPiece = getStartingPieces(row, col);
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
        if (row === 6 && col === 6) return new Pawn({ x: col, y: row }, 1);
        if (row === 7 && col === 7) return new Pawn({ x: col, y: row }, 2);
        if (row === 8 && col === 8) return new Pawn({ x: col, y: row }, 3);
        if (row === 9 && col === 9) return new Pawn({ x: col, y: row }, 4);

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
                }
            }
        }

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

        if ("hasMoved" in movingPiece && !movingPiece.hasMoved) {
            (movingPiece as { hasMoved: boolean }).hasMoved = true;
        }

        movingPiece.index = { ...cell.index };
        if (cell.piece) doAttack(cell);
        cell.piece = movingPiece;
        lastSelected.piece = null;
        setLastSelected(null);

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
        for (const move of moves) {
            const targetCell = localCells[move.y][move.x];
            if (!targetCell) continue;
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

    return (
        <View style={styles.gameContainer}>
            <SafeAreaView>
                <Zoomable style={[styles.gameContainer, styles.zoomContainer]} setPanOrPinchActive={setPanOrPinchActive}>
                    {board.map((row, x) => (
                        <View key={`row-${x}`} style={styles.row}>
                            {row.map((cellState, y) =>
                                cellState ? (<Cell key={`${x}-${y}`} onCellPress={() => onCellPress(x, y)} selectedColor={["maroon","blue","darkgreen","darkgoldenrod"][(lastSelected?.piece?.player ?? 1) - 1]} {...cellState} />) : <View key={`${x}-${y}`} style={styles.emptyCell} />
                            )}
                        </View>
                    ))}
                </Zoomable>
            </SafeAreaView>
        </View>
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
});