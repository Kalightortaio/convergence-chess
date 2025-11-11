import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useDimensions() {
    const [window, setWindow] = useState(Dimensions.get("window"));
    const insets = useSafeAreaInsets();
    const gridSize = 18;
    
    useEffect(() => {
        const sub = Dimensions.addEventListener("change", ({ window }) => {
            setWindow(window);
        });
        return () => sub.remove();
    }, []);
    
    const visibleWidth = window.width - (insets.left + insets.right);
    const visibleHeight = window.height - (insets.top + insets.bottom);
    const isPortrait = visibleHeight >= visibleWidth;
    const minDim = isPortrait ? visibleWidth : visibleHeight;
    const maxDim = isPortrait ? visibleHeight : visibleWidth;
    const navBarSizeInCells = 2.5;
    const cellSize = minDim / (gridSize + (isPortrait ? 0 : navBarSizeInCells));
    const navBarSize = navBarSizeInCells * cellSize;
    const usableHeight = visibleHeight - navBarSize;
    const boardSize = cellSize * gridSize;
    const overlaySize = (maxDim - boardSize - (isPortrait ? navBarSize : 0)) / 2;

    const scaleText = (fontSize: number): number => {
        const scale = boardSize / 400;
        return Math.round(fontSize * scale);
    };

    return { boardSize, cellSize, gridSize, isPortrait, visibleHeight, visibleWidth, overlaySize, navBarSize, usableHeight, scaleText };
}