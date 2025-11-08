import React, { useMemo } from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";
import SVGLoader from "./SVGLoader";
import { CellStateProps } from "../Types";
import { King } from "../core/pieces/King";
import { useDimensions } from "../hooks/useDimensions";
import { transform } from "lodash";

interface CellComponentProps extends CellStateProps {
    onCellPress: () => void,
    selectedColor?: string,
    viewRotation?: number,
}

function Cell({ onCellPress, selectedColor, viewRotation = 0, ...cellStateProps }: CellComponentProps) {
    const { index, shaded, piece } = cellStateProps;
    const whiteCell = (index.x + index.y) % 2 === 0;
    const pieceType = piece?.type;
    const checkedPiece = (pieceType === "king") && (piece as King).checked;
    const deadKing = ((pieceType === "dead_king") ? 90 : 0) + viewRotation;

    const rightColor = piece?.getPlayer().rightColor;
    const leftColor = piece?.getPlayer().leftColor;

    function withOpacity(hexColor: string, opacity: number): string {
        if (!hexColor) return `rgba(0, 0, 0, ${opacity})`;
        const hex = hexColor.replace("#", "");

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    const { cellSize } = useDimensions();
    const hookStyles = useMemo(() => StyleSheet.create({
        cell: {
            height: cellSize,
            width: cellSize,
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
        },
    }), [cellSize]);

    return (
        <TouchableWithoutFeedback onPress={() => onCellPress()}>
            <View style={[hookStyles.cell, whiteCell ? styles.whiteCell : styles.blackCell, transform({ rotate: `${viewRotation}deg` })]}>
                {shaded && selectedColor && (<View style={[StyleSheet.absoluteFill, { backgroundColor: withOpacity(selectedColor, 0.4) }]} />)}
                {checkedPiece && rightColor && (<View style={[StyleSheet.absoluteFill, { backgroundColor: withOpacity(rightColor, 0.8) }]} />)}
                {pieceType && <SVGLoader style={{ zIndex: 1 }} type="symbol" name={pieceType} rightColor={rightColor} leftColor={leftColor} rotate={deadKing}/>}
                {checkedPiece && rightColor && <View style={styles.svgContainer}>
                    <SVGLoader type="symbol" name="checked" rightColor={rightColor} leftColor={leftColor} />
                </View>}
            </View>
        </TouchableWithoutFeedback>
    )
}

export default Cell;

const styles = StyleSheet.create({
    whiteCell: {
        backgroundColor: '#e0d9c6'
    },
    blackCell: {
        backgroundColor: '#b59669ff'
    },
    svgContainer: {
        position: 'absolute',
        top: '40%',
        left: '40%',
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    }
});