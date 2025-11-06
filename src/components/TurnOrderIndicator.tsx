import { View, Text } from "react-native";

export default function TurnOrderIndicator({ players, currentTurn }: { players: any[]; currentTurn: number }) {
    return (
        <View>
            <Text style={{ fontSize: 28, fontFamily: 'ComicSansMS' }}>{players.find(p => p.id === currentTurn)?.name}'s Turn</Text>
        </View>
    );
}
