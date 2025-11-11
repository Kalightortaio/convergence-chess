import { View, Text } from "react-native";
import { RootStackParamList } from "../Types";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigationProvider } from "../components/NavigationProvider";
import { useDimensions } from "../hooks/useDimensions";

type ProfileProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function Profile({ navigation }: ProfileProps) {
    const { scaleText } = useDimensions();
    return (
        <NavigationProvider navigation={navigation}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red'}}>
                <Text adjustsFontSizeToFit={true} style={{fontSize: scaleText(24), fontFamily: 'ComicSansMS' }}>Profile Screen</Text>
            </View>
        </NavigationProvider>
    )
}