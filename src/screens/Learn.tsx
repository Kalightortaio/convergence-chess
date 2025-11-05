import { View, Text } from "react-native";
import { scaleText } from "../Constants";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../Types";
import { NavigationProvider } from "../components/NavigationProvider";

type LearnProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Learn'>;
};

export default function Learn({ navigation }: LearnProps) {
    return (
        <NavigationProvider navigation={navigation}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'blue'}}>
                <Text style={{fontSize: scaleText(24), fontFamily: 'ComicSansMS'}}>Learn Screen</Text>
            </View>
        </NavigationProvider>
    )
}