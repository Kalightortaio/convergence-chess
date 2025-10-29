import { Dimensions } from 'react-native';

export const gridSize = 18;
export const screenWidth = Dimensions.get('window').width;
export const cellSize = (screenWidth / gridSize);
export const boardSize = gridSize * cellSize;

export const scaleText = (fontSize: number): number => {
    const baseScreenWidth = 450;
    const scale = screenWidth / baseScreenWidth;
    return Math.round(fontSize * scale);
};