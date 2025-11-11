import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Player } from "../core/Player";
import { useDimensions } from "../hooks/useDimensions";
import { useMemo } from "react";
import SVGLoader from "./SVGLoader";

interface TurnIndicatorProps {
    player?: Player;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    setSettingsModal: (visible: boolean) => void;
}

export default function TurnIndicator({ player, isPaused, setIsPaused, setSettingsModal }: TurnIndicatorProps) {
    if (!player) return;
    const { cellSize, boardSize, overlaySize, isPortrait, scaleText } = useDimensions();

    const hookStyles = useMemo(() => StyleSheet.create({
        topRight: {
            position: 'absolute', 
            top: 0,
            right: 0,
            width: 7 * cellSize,
            height: Math.min(overlaySize, 4 * cellSize),
        },
        topLeft: {
            position: 'absolute', 
            top: 0,
            left: 0,
            width: 11 * cellSize,
            height: Math.min(overlaySize, 4 * cellSize),
            alignItems: 'flex-end',
            justifyContent: 'center',
        },
        rightTop: {
            position: 'absolute', 
            top: 0,
            right: 0,
            width: overlaySize,
            height: 3 * cellSize,
        },
        rightBottom: {
            position: 'absolute',
            bottom: 0,
            width: overlaySize,
            height: 15 * cellSize,
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
    }), [boardSize, cellSize, overlaySize]);

    return (
        <View style={{ justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
            <View style={(isPortrait ? hookStyles.topLeft : hookStyles.rightBottom)}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text adjustsFontSizeToFit={true} style={{ fontSize: scaleText(14), fontFamily: 'ComicSansMS', color: 'black' }}>{player.name}'s Turn</Text>
                    <Text adjustsFontSizeToFit={true} style={{ fontSize: scaleText(12), fontFamily: 'ComicSansMS', color: 'black' }}>Time Remaining: {player.timeRemaining}</Text>
                </View>
            </View>
            <View style={[(isPortrait ? hookStyles.topRight : hookStyles.rightTop ), styles.buttonContainer]}>
                <View style={styles.buttonRow}></View>
                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
                        <View style={styles.button}>
                            <SVGLoader type="ui" name={isPaused ? "play" : "pause"} scale={isPortrait ? 1 : 1.2}/>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSettingsModal(true)}>
                        <View style={styles.button}>
                            <SVGLoader type="ui" name="options" scale={isPortrait ? 1 : 1.2}/>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                    <View style={styles.button}>
                            <SVGLoader type="ui" name="exit" scale={isPortrait ? 1 : 1.2}/>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}></View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    buttonRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    button: {
        height: '100%',
        width: 'auto',
        aspectRatio: 1,
    }
});