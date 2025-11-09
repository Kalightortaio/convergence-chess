import { View, Text, Image, StyleSheet, TouchableHighlight } from "react-native";
import SVGLoader from "./SVGLoader";
import { Player } from "../core/Player";
import { useDimensions } from "../hooks/useDimensions";
import { useMemo } from "react";
import { PIECE_POINTS } from "../Constants";

interface PlayerUIProps {
  players: Player[];
  viewRotation?: number;
  setViewRotation: (rotation: number) => void;
}

export default function PlayerUI({ players, viewRotation = 0, setViewRotation }: PlayerUIProps) {
    const { cellSize, scaleText } = useDimensions();
    const hookStyles = useMemo(() => StyleSheet.create({
        corner: {
            position: 'absolute',
            width: 5 * cellSize,
            height: 5 * cellSize,
            borderWidth: Math.floor(cellSize / 4),
            padding: Math.floor(cellSize / 4),
            gap: Math.floor(cellSize / 4),
            overflow: 'hidden',
        },
        playerInfoRow: {
            flexDirection: "row",
            justifyContent: "flex-start",
            width: '100%',
            height: cellSize,
        },
        captureRow: {
            flexWrap: 'wrap',
            flexDirection: "row",
            alignContent: "space-between",
            justifyContent: "flex-start",
            width: '100%',
            height: 2 * cellSize,
            marginTop: (cellSize / 8),
            marginLeft: -(cellSize / 6),
        },
        captureSlot: {
            width: '25%',
            height: cellSize,
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
        },
        scoreRow: {
            flexDirection: "row",
            justifyContent: "flex-start",
            width: '100%',
            alignItems: 'center',
            top: -(cellSize / 8),
        },
        image: {
            height: cellSize,
            aspectRatio: 1,
            marginRight: Math.floor(cellSize / 4),
        },
        nameText: {
            fontSize: scaleText(13),
            fontFamily: "ComicSansMS",
            marginTop: -Math.floor(cellSize / 8),
            marginBottom: -Math.floor(cellSize / 8),
        },
        captureTextContainer: {
            position: 'absolute',
            right: -(cellSize / 8),
            top: -(cellSize / 8),
        },
        subtitleText: {
            fontSize: scaleText(9),
            fontFamily: "ComicSansMS",
        },
        captureText: {
            fontSize: scaleText(9),
            fontFamily: "ComicSansMS",
        },
    }), [cellSize]);

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {players.map(player => (
                <TouchableHighlight key={player.id} onPress={() => setViewRotation((player.id - 1) * 90)} activeOpacity={1} underlayColor={player.leftColor} style={[hookStyles.corner, styles[player.position], { backgroundColor: player.middleColor, borderRightColor: player.rightColor, borderBottomColor: player.botColor, borderLeftColor: player.leftColor, borderTopColor: player.topColor}, { transform: [{ rotate: `${viewRotation}deg` }] }]}>
                    <View>
                        <View style={hookStyles.playerInfoRow}>
                            <Image style={hookStyles.image} source={player.photo}/>
                            <View style={{ flexDirection: "column", flex: 1 }}>
                                <View style={{width: '100%'}}>
                                    <Text style={hookStyles.nameText} numberOfLines={1} ellipsizeMode="tail">{player.name}</Text>
                                </View>
                                <Text style={hookStyles.subtitleText} numberOfLines={1} ellipsizeMode="clip">{player.title}</Text>
                            </View>
                        </View>
                        <View style={hookStyles.captureRow}>
                            {player.capturedPieces.map(piece =>
                                (piece.count > 0) && (
                                    <View key={piece.type} style={hookStyles.captureSlot}>
                                        <SVGLoader type="symbol" scale={0.75} name={piece.type} leftColor="white" rightColor="white" />
                                        <View style={hookStyles.captureTextContainer}>
                                            <Text style={hookStyles.captureText}>×{piece.count}</Text>
                                        </View>
                                    </View>
                                )
                            )}
                        </View>
                        <View style={hookStyles.scoreRow}>
                            <Text style={hookStyles.subtitleText} numberOfLines={1} ellipsizeMode="clip">Score: {player.score}</Text>
                        </View>
                        <View style={hookStyles.scoreRow}>
                            <Text style={hookStyles.subtitleText} numberOfLines={1} ellipsizeMode="clip">Move: {player.lastMove}</Text>
                        </View>
                    </View>
                </TouchableHighlight>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
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