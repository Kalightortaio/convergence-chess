import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CellStateProps } from '../Types'
import { cellSize, gridSize } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Game() {
    const [cells, setCells] = useState<(CellStateProps | null)[][]>(initializeCells());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);
    const [lastSelected, setLastSelected] = useState<CellStateProps | null>(null);

    function initializeCells(): (CellStateProps | null)[][] {
        const initialCells: (CellStateProps | null)[][] = [];
        for (let row = 0; row < gridSize; row++) {
            const currentRow: (CellStateProps | null)[] = [];
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

    function getStartingPieces(row: number, col: number) {
        const layouts = {
            front: Array(8).fill('pawn'),
            middle: ['pawn', 'scout', 'knight', 'bishop', 'bishop', 'knight', 'scout', 'pawn'],
            back: ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'],
        }

        const pickPiece = (index: number, player: number, rank: keyof typeof layouts) => {
            const localIndex = index - 5;
            const order = layouts[rank];
            const pieceType = order[localIndex % order.length];
            return { type: pieceType, hasMoved: false, player }
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
        if ((row === 8) && (col === 9)) return { type: "rook", hasMoved: false, player: 2 };
        if ((row === 9) && (col === 9)) return { type: "rook", hasMoved: false, player: 1 };
        if ((row === 10) && (col === 10)) return { type: "rook", hasMoved: false, player: 4 };

        return null;
    }

    const onCellPress = throttle((row: number, col: number) => {
        if (!isPanOrPinchActive) {
            let localCells = [...cells];
            const cell = localCells[row][col];
            if (!cell) return;
            // Handle currently selected cell & shaded cells.
            if (lastSelected) {
                const isSameCell = lastSelected.index.x === cell.index.x && lastSelected.index.y === cell.index.y;
                if (isSameCell) {
                    lastSelected.selected = false;
                    drawMoves(lastSelected, false);
                    setLastSelected(null);
                    return;
                } 
                const lastPlayer = lastSelected.piece?.player;
                // Handle interacting with other pieces.
                if (cell?.piece) {
                    const sameTeam = cell.piece.player === lastPlayer;
                    // Capture enemy piece if shaded.
                    if (!sameTeam) {
                        if (cell.shaded) {
                            drawMoves(lastSelected, false);
                            doMove(cell);
                        }
                        return;
                    } else {
                        // Switch selection with a different one of your pieces.
                        lastSelected.selected = false;
                        drawMoves(lastSelected, false);

                        cell.selected = true;
                        setLastSelected(cell);
                        drawMoves(cell, true);
                        return;
                    }
                } else {
                    // Move to empty cell only if shaded.
                    if (cell.shaded) {
                        drawMoves(lastSelected, false);
                        doMove(cell);
                    }
                    return;
                }
            }
            // No lastSelected currently, this sets one.
            if (cell.piece) {
                cell.selected = !cell.selected;
                if (cell.selected) {
                    setLastSelected(cell);
                    drawMoves(cell, true);
                }
            }
        }
    }, 0);

    function doMove(cell: CellStateProps) {
        if (!lastSelected) return;
        if (!lastSelected.piece) return;
        if (cell.piece) doAttack(cell);
        lastSelected.piece.hasMoved = true;
        cell.piece = lastSelected?.piece;
        lastSelected.piece = null;
        setLastSelected(null);
    }

    function doAttack(cell: CellStateProps) {
        // Right now this function does nothing.
        // In the future, we will track points,
        // process Checks, update the UI, etc. 
    }

    function drawMoves(cell: CellStateProps, shouldShade: boolean) {
        let localCells = [...cells];
        cell.shaded = shouldShade;
        if (!cell?.piece) return;
        switch (cell?.piece.type) {
            case 'pawn': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const blocked: Record<number, number[]> = {
                    1: [0, 1],
                    2: [-1, 0],
                    3: [0, -1],
                    4: [1, 0],
                };
                const allDirections = [
                    [0, 1], [0, -1],
                    [1, 0], [-1, 0],
                ];
                const moves = allDirections.filter(
                    ([dx, dy]) => !(dx === blocked[player][0] && dy === blocked[player][1])
                );
                for (const [dx, dy] of moves) {
                    const forward1 = localCells[y + dy]?.[x + dx];
                    if (forward1 && !forward1.piece) forward1.shaded = shouldShade;
                    const forward2 = localCells[y + dy * 2]?.[x + dx * 2];
                    if (!cell.piece.hasMoved && forward1 && !forward1.piece && forward2 && !forward2.piece) {
                        forward2.shaded = shouldShade;
                    }
                }
                const diagonals = [
                    [1, 1], [1, -1],
                    [-1, 1], [-1, -1],
                ];
                for (const [dx, dy] of diagonals) {
                    const target = localCells[y + dy]?.[x + dx];
                    if (target?.piece && target.piece.player !== player) {
                        target.shaded = shouldShade;
                    }
                }
                break;
            }
            case 'scout': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const directions = [
                    [0, 1], [0, -1], [1, 0], [-1, 0],
                    [1, 1], [1, -1], [-1, 1], [-1, -1],
                ];
                for (const [dx, dy] of directions) {
                    const maxStep = (Math.abs(dx) === 1 && Math.abs(dy) === 1) ? 1 : 2;
                    for (let step = 1; step <= maxStep; step++) {
                        const target = localCells[y + dy * step]?.[x + dx * step];
                        if (!target) break;
                        if (!target.piece) {
                            target.shaded = shouldShade;
                            continue;
                        }
                        if (target.piece.player !== player) {
                            target.shaded = shouldShade;
                        }
                        break;
                    }
                }
                break;
            }
            case 'rook': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const directions = [
                    [0, 1],
                    [0, -1],
                    [1, 0],
                    [-1, 0],
                ];
                for (const [dx, dy] of directions) {
                    for (let step = 1; ; step++) {
                        const target = localCells[y + dy * step]?.[x + dx * step];
                        if (!target) break;
                        if (!target.piece) {
                            target.shaded = shouldShade;
                            continue;
                        }
                        if (target.piece.player !== player) {
                            target.shaded = shouldShade;
                        }
                        break;
                    }
                }
                break;
            }
            case 'bishop': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const directions = [
                    [1, 1],
                    [1, -1],
                    [-1, 1],
                    [-1, -1],
                ];
                for (const [dx, dy] of directions) {
                    for (let step = 1; ; step++) {
                        const target = localCells[y + dy * step]?.[x + dx * step];
                        if (!target) break;
                        if (!target.piece) {
                            target.shaded = shouldShade;
                            continue;
                        }
                        if (target.piece.player !== player) {
                            target.shaded = shouldShade;
                        }
                        break;
                    }
                }
                break;
            }
            case 'knight': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const jumps = [
                    [1, 2], [2, 1],
                    [2, -1], [1, -2],
                    [-1, -2], [-2, -1],
                    [-2, 1], [-1, 2],
                ];
                for (const [dx, dy] of jumps) {
                    const target = localCells[y + dy]?.[x + dx];
                    if (!target) continue;
                    if (!target.piece || target.piece.player !== player) {
                        target.shaded = shouldShade;
                    }
                }
                break;
            }
            case 'king': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const directions = [
                    [0, 1], [0, -1], [1, 0], [-1, 0],
                    [1, 1], [1, -1], [-1, 1], [-1, -1],
                ];
                for (const [dx, dy] of directions) {
                    const target = localCells[y + dy]?.[x + dx];
                    if (!target) continue;
                    if (!target.piece || target.piece.player !== player) {
                        target.shaded = shouldShade;
                    }
                }
                break;
            }
            case 'queen': {
                const { x, y } = cell.index;
                const player = cell.piece.player;
                const directions = [
                    [0, 1], [0, -1], [1, 0], [-1, 0],
                    [1, 1], [1, -1], [-1, 1], [-1, -1],
                ];
                for (const [dx, dy] of directions) {
                    for (let step = 1; ; step++) {
                        const target = localCells[y + dy * step]?.[x + dx * step];
                        if (!target) break;
                        if (!target.piece) {
                            target.shaded = shouldShade;
                            continue;
                        }
                        if (target.piece.player !== player) {
                            target.shaded = shouldShade;
                        }
                        break;
                    }
                }
                break;
            }
            default: {
                console.warn(`Unknown piece '${cell?.piece.type}' for drawMoves()`);
            }
        }
    }

    return (
        <View style={styles.gameContainer}>
            <SafeAreaView>
                <Zoomable style={[styles.gameContainer, styles.zoomContainer]} setPanOrPinchActive={setPanOrPinchActive}>
                    {cells.map((row, x) => (
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