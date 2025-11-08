import { View, Text } from "react-native";
import { Player } from "../core/Player";

interface TurnIndicatorProps {
    player?: Player;
    leftOverlay: boolean;
}

export default function TurnIndicator({ player, leftOverlay }: TurnIndicatorProps) {
    if (!player) return;
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Text style={{ fontSize: 28, fontFamily: 'ComicSansMS', color: 'white' }}></Text>
        </View>
    );
}
