import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Player } from "../core/Player";
import { useDimensions } from "../hooks/useDimensions";
import { useMemo } from "react";
import SVGLoader from "./SVGLoader";

interface TurnIndicatorProps {
    player?: Player;
    isPaused: boolean;
    showTimer: boolean;
    viewRotation?: number;
    setIsPaused: (paused: boolean) => void;
    setSettingsModal: (visible: boolean) => void;
    skipTurn: () => void;
}

export default function TurnIndicator({ player, isPaused, showTimer, viewRotation, setIsPaused, setSettingsModal, skipTurn }: TurnIndicatorProps) {
    if (!player) return;

    const { cellSize, boardSize, overlaySize, isPortrait, scaleText } = useDimensions();
    const shouldScaleText = overlaySize > 4 * cellSize;
    const rotation = viewRotation || 0;
    const rotationFloored = rotation < 180 ? 0 : 180;

    const hookStyles = useMemo(() => StyleSheet.create({
        portraitRight: {
            position: 'absolute', 
            top: 0,
            right: 0,
            width: 7 * cellSize,
            height: Math.min(overlaySize, 4 * cellSize),
        },
        portraitMiddle: {
            position: 'absolute', 
            top: 0,
            left: 0,
            width: 11 * cellSize,
            height: Math.min(overlaySize, 4 * cellSize),
            alignItems: 'flex-end',
            justifyContent: 'center',
        },
        portraitLeft: {
            position: 'absolute', 
            top: 0,
            left: 0,
            width: 7 * cellSize,
            height: Math.min(overlaySize, 4 * cellSize),
        },
        landscapeRight: {
            position: 'absolute', 
            top: 0,
            right: 0,
            width: overlaySize,
            height: 6 * cellSize,
        },
        landscapeMiddle: {
            width: overlaySize,
        },
    }), [boardSize, cellSize, overlaySize, isPortrait, scaleText]);

    return (
        <View style={{ flex: 1, flexDirection: isPortrait ? 'row' : 'column', justifyContent: 'space-evenly', alignItems: 'center' }}>
            <View style={(isPortrait ? hookStyles.portraitMiddle : hookStyles.landscapeMiddle)}>
                <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: isPortrait ? cellSize / 2 : 0, padding: isPortrait ? 0 : cellSize, transform: [{ rotate: `${rotationFloored}deg` }] }}>
                    <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ fontSize: shouldScaleText ? scaleText(24) : scaleText(16), fontFamily: 'ComicSansMS', color: 'black' }}>{player.name}'s Turn</Text>
                    {showTimer && <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{ fontSize: shouldScaleText ? scaleText(18) : scaleText(10), fontFamily: 'ComicSansMS', color: 'black' }}>Time Remaining: {player.timeRemaining}</Text>}
                </View>
            </View>
            {isPortrait ? (
                <View style={[hookStyles.portraitRight, styles.buttonContainer]}>
                    <View style={styles.buttonRow}></View>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={() => skipTurn()}>
                            <View style={[styles.button, {transform: [{ rotate: `${rotation}deg` }]}]}>
                                <SVGLoader type="ui" name="skip" scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
                            <View style={[styles.button, {transform: [{ rotate: `${rotation}deg` }]}]}>
                                <SVGLoader type="ui" name={isPaused ? "play" : "pause"} scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSettingsModal(true)}>
                            <View style={[styles.button, {transform: [{ rotate: `${rotation}deg` }]}]}>
                                <SVGLoader type="ui" name="options" scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <View style={[styles.button, {transform: [{ rotate: `${rotation}deg` }]}]}>
                                <SVGLoader type="ui" name="exit" scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.buttonRow}></View>
                </View>
            ) : (
                <View style={[hookStyles.landscapeRight, styles.buttonContainer]}>
                    <View style={styles.buttonRow}></View>
                    <View style={styles.buttonRow}>
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
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={() => skipTurn()}>
                            <View style={styles.button}>
                                <SVGLoader type="ui" name="skip" scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsPaused(!isPaused)}>
                            <View style={styles.button}>
                                <SVGLoader type="ui" name={isPaused ? "play" : "pause"} scale={isPortrait ? 1 : 1.2}/>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.buttonRow}></View>
                </View>
            )}
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