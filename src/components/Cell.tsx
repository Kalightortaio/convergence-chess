import React from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { cellSize } from "../Constants";
import SVGLoader from "./SVGLoader";
import { CellStateProps } from "../Types";

interface CellComponentProps extends CellStateProps {
    onCellPress: () => void,
    selectedColor?: string;
}

function Cell({ onCellPress, selectedColor, ...cellStateProps }: CellComponentProps) {

    const whiteCell = (cellStateProps.index.x + cellStateProps.index.y) % 2 === 0;
    const shadedCell = cellStateProps.shaded;
    const pieceType = cellStateProps.piece?.type;
    const playerColorsLeft = ["red","skyblue","springgreen","gold"];
    const pieceColorLeft = playerColorsLeft[(cellStateProps.piece?.player ?? 1) - 1];
    const playerColorsRight = ["maroon","blue","darkgreen","darkgoldenrod"];
    const pieceColorRight = playerColorsRight[(cellStateProps.piece?.player ?? 1) - 1];

    function withOpacity(color: string, opacity: number) {
        const rgbaMap: Record<string, string> = {
            maroon: `rgba(128, 0, 0, ${opacity})`,
            blue: `rgba(0, 0, 255, ${opacity})`,
            darkgreen: `rgba(0, 100, 0, ${opacity})`,
            darkgoldenrod: `rgba(184, 134, 11, ${opacity})`,
        };
        return rgbaMap[color] || color;
    }

    return (
        <TouchableWithoutFeedback onPress={() => onCellPress()}>
            <View style={[styles.cell, whiteCell ? styles.whiteCell : styles.blackCell]}>
                {shadedCell && selectedColor && (<View style={[StyleSheet.absoluteFill, { backgroundColor: withOpacity(selectedColor, 0.4) }]} />)}
                {pieceType && <SVGLoader type="symbol" name={pieceType} rightColor={pieceColorRight} leftColor={pieceColorLeft} />}
            </View>
        </TouchableWithoutFeedback>
    )
}

export default Cell;

const styles = StyleSheet.create({
    cell: {
        height: cellSize,
        width: cellSize,
        alignItems: 'center',
        justifyContent: 'center',
    },
    whiteCell: {
        backgroundColor: '#e0d9c6'
    },
    blackCell: {
        backgroundColor: '#977e58ff'
    }
});