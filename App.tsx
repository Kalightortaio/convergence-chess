import { useFonts } from "expo-font";
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from "@react-navigation/native";
import { RootStackParamList } from "./src/Types";
import Game from './src/screens/Game';
import Profile from "./src/screens/Profile";
import Learn from "./src/screens/Learn";
import Navbar from "./src/components/Navbar";

const Tab = createBottomTabNavigator<RootStackParamList>();

export default function App() {
	const [fontsLoaded] = useFonts({
		ComicSansMS: require("./assets/fonts/ComicSansMS.ttf"),
	});

	if (!fontsLoaded) {
		return null;
	}

	return (
		<GestureHandlerRootView>
			<StatusBar hidden />
        	<SafeAreaView style={styles.appContainer}>
				<NavigationContainer>
					<Tab.Navigator initialRouteName="Game" tabBar={() => <Navbar />}>
						<Tab.Screen name="Game" component={Game} options={{ headerShown: false }} />
						<Tab.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
						<Tab.Screen name="Learn" component={Learn} options={{ headerShown: false }} />
					</Tab.Navigator>
				</NavigationContainer>
			</SafeAreaView>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	appContainer: {
		flex: 1,
		backgroundColor: 'black',
	},
});
