import { View, Text, Image, StyleSheet } from "react-native";
import { cellSize, scaleText } from "../Constants";
import SVGLoader from "./SVGLoader";
import { Player } from "../core/Player";

interface PlayerUIProps {
  players: Player[];
}

export default function PlayerUI({ players }: PlayerUIProps) {
    return (
        <View style={StyleSheet.absoluteFillObject}>
            {players.map(player => (
                <View key={player.id} style={[styles.corner, styles[player.position], { backgroundColor: player.middleColor, borderRightColor: player.rightColor, borderBottomColor: player.botColor, borderLeftColor: player.leftColor, borderTopColor: player.topColor }]}>
                    <View style={styles.playerInfoRow}>
                        <Image style={styles.image} source={player.photo}/>
                        <View style={{ flexDirection: "column", flex: 1 }}>
                            <View style={{width: '100%'}}>
                                <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">{player.name}</Text>
                            </View>
                            <Text style={styles.subtitleText} numberOfLines={1} ellipsizeMode="clip">{player.title}</Text>
                        </View>
                    </View>
                    <View style={styles.captureRow}>
                        {player.capturedPieces.map(piece =>
                            (piece.count > 0) && (
                                <View key={piece.type} style={styles.captureSlot}>
                                    <SVGLoader type="symbol" scale={0.75} name={piece.type} leftColor="white" rightColor="white" />
                                    <View style={styles.captureTextContainer}>
                                        <Text style={styles.captureText}>×{piece.count}</Text>
                                    </View>
                                </View>
                            )
                        )}
                    </View>
                    <View style={styles.scoreRow}>
                        <Text style={styles.subtitleText} numberOfLines={1} ellipsizeMode="clip">Score: {player.score}</Text>
                    </View>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
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
        height: Math.floor(cellSize / 2),
        alignItems: 'center',
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
    subtitleText: {
        fontSize: scaleText(9),
        fontFamily: "ComicSansMS",
    },
    captureText: {
        fontSize: scaleText(9),
        fontFamily: "ComicSansMS",
    },
    captureTextContainer: {
        position: 'absolute',
        right: -(cellSize / 8),
        top: -(cellSize / 8),
    },
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