import { View, Text } from "react-native";
import { scaleText } from "../Constants";
import { RootStackParamList } from "../Types";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigationProvider } from "../components/NavigationProvider";

type ProfileProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function Profile({ navigation }: ProfileProps) {
    return (
        <NavigationProvider navigation={navigation}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red'}}>
                <Text style={{fontSize: scaleText(24), fontFamily: 'ComicSansMS'}}>Profile Screen</Text>
            </View>
        </NavigationProvider>
    )
}