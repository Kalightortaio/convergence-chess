import { View, Text } from "react-native";
import { useDimensions } from "../hooks/useDimensions";

interface MoveHistoryProps {
}

export default function MoveHistory({}: MoveHistoryProps) {
    const { scaleText } = useDimensions();
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Text adjustsFontSizeToFit={true} style={{ fontSize: scaleText(24), fontFamily: 'ComicSansMS', color: 'white' }}></Text>
        </View>
    );
}
