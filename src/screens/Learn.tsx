import { View, Text } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../Types";
import { NavigationProvider } from "../components/NavigationProvider";
import { useDimensions } from "../hooks/useDimensions";

type LearnProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Learn'>;
};

export default function Learn({ navigation }: LearnProps) {
    const { scaleText } = useDimensions();
    return (
        <NavigationProvider navigation={navigation}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue'}}>
                <Text adjustsFontSizeToFit={true} style={{ fontSize: scaleText(24), fontFamily: 'ComicSansMS' }}>Learn Screen</Text>
            </View>
        </NavigationProvider>
    )
}