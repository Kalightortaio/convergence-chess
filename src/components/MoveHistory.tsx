
import { View, Text } from "react-native";
import { Player } from "../core/Player";

interface MoveHistoryProps {
    rightOverlay: boolean;
}

export default function MoveHistory({ rightOverlay }: MoveHistoryProps) {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Text style={{ fontSize: 28, fontFamily: 'ComicSansMS', color: 'white' }}></Text>
        </View>
    );
}
