import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CellStateProps } from '../Types'
import { cellSize, gridSize } from '../Constants';
import Zoomable from '../components/Zoomable';
import Cell from '../components/Cell';
import { throttle } from 'lodash';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Game() {
    const [cells, setCells] = useState<(CellStateProps| null)[][]>(initializeCells());
    const [isPanOrPinchActive, setPanOrPinchActive] = useState(false);

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
            return { type: pieceType, player }
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

        return null;
    }

    const onCellPress = throttle((row: number, col: number) => {
        if (!isPanOrPinchActive) {
            let localCells = [...cells];
            const cell = localCells[row][col];
            console.log(cell);
        }
    });

    return (
        <View style={styles.gameContainer}>
            <SafeAreaView>
                <Zoomable style={[styles.gameContainer, styles.zoomContainer]} setPanOrPinchActive={setPanOrPinchActive}>
                    {cells.map((row, x) => (
                        <View key={`row-${x}`} style={styles.row}>
                            {row.map((cellState, y) =>
                                cellState ? (<Cell key={`${x}-${y}`} onCellPress={() => onCellPress(x, y)} {...cellState} />) : <View key={`${x}-${y}`} style={styles.emptyCell} />
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