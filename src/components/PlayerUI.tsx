import { View, Text, Image, StyleSheet } from "react-native";
import { cellSize, scaleText } from "../Constants";
import SVGLoader from "./SVGLoader";

export default function PlayerUI(this: any) {
    type CornerPosition = 'topLeft' | 'topRight' | 'botLeft' | 'botRight';

    interface Player { // Todo: Create a proper Player class
        id: number;
        name: string;
        title: string;  
        rightColor: string;
        leftColor: string;
        middleColor: string;
        photo: { uri: string } | number; // number for local images via require()
        position: CornerPosition;
    }

    function blendColors(hex1: string, hex2: string): string {
        const parseHex = (hex: string) => hex.replace('#', '');
        const toInt = (hex: string) => parseInt(hex, 16);
        
        const c1 = parseHex(hex1);
        const c2 = parseHex(hex2);

        const r1 = toInt(c1.substring(0, 2));
        const g1 = toInt(c1.substring(2, 4));
        const b1 = toInt(c1.substring(4, 6));

        const r2 = toInt(c2.substring(0, 2));
        const g2 = toInt(c2.substring(2, 4));
        const b2 = toInt(c2.substring(4, 6));

        const rMid = Math.round((r1 + r2) / 2);
        const gMid = Math.round((g1 + g2) / 2);
        const bMid = Math.round((b1 + b2) / 2);

        const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
        return `#${toHex(rMid)}${toHex(gMid)}${toHex(bMid)}`;
    }

    const players: Player[] = [ // Todo: Allow players to choose their colors in the lobby. Names and profile pics should be fetched from their profiles, and can be changed on the fly.
        { id: 1, name: "FrankFurt", title: "Novice", rightColor: "#800000", leftColor: "#FF0000", get middleColor() { return blendColors(this.rightColor, this.leftColor); }, photo: {uri: "https://randomuser.me/api/portraits/men/42.jpg"}, position: "botRight" },
        { id: 2, name: "Agent 67 Test Overflow", title: "Adept", rightColor: "#0000FF", leftColor: "#87CEEB", get middleColor() { return blendColors(this.rightColor, this.leftColor); }, photo: {uri: "https://randomuser.me/api/portraits/women/0.jpg"}, position: "botLeft" },
        { id: 3, name: "MortyMC", title: "Comeback Kid", rightColor: "#006400", leftColor: "#00FF7F", get middleColor() { return blendColors(this.rightColor, this.leftColor); }, photo: {uri: "https://randomuser.me/api/portraits/men/16.jpg"}, position: "topLeft" },
        { id: 4, name: "AlphaRad", title: "Grandmaster", rightColor: "#B8860B", leftColor: "#FFD700", get middleColor() { return blendColors(this.rightColor, this.leftColor); }, photo: {uri: "https://randomuser.me/api/portraits/women/7.jpg"}, position: "topRight" },
    ];

    const capturedPieces = [
        { type: "king", count: 3 },
        { type: "queen", count: 17 },
        { type: "scout", count: 8 },
        { type: "knight", count: 19 },
        { type: "rook", count: 34 },
        { type: "bishop", count: 4 },
        { type: "pawn", count: 71 },
    ];

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {players.map(player => (
                <View key={player.id} style={[styles.corner, styles[player.position], { backgroundColor: player.middleColor, borderRightColor: player.rightColor, borderBottomColor: player.rightColor, borderLeftColor: player.leftColor, borderTopColor: player.leftColor }]}>
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
                        {capturedPieces.map(piece =>
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
                        <Text style={styles.subtitleText} numberOfLines={1} ellipsizeMode="clip">Score: 9001</Text>
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