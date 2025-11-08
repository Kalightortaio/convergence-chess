import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as AndroidNavigation from 'expo-navigation-bar';
import { StatusBar } from "expo-status-bar";
import { RootStackParamList } from "../Types";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDimensions } from "../hooks/useDimensions";
import Game from './Game';
import Profile from "./Profile";
import Learn from "./Learn";
import Navbar from "../components/Navbar";

const Tab = createBottomTabNavigator<RootStackParamList>();

export default function SafeAreaApp() {
    const { isPortrait } = useDimensions();
	useEffect(() => {
        if (Platform.OS === 'android') AndroidNavigation.setVisibilityAsync('hidden');
	}, [isPortrait]);
    
	return (
        <View style={styles.appContainer}>
            <StatusBar hidden />
            <SafeAreaView style={styles.appContainer}>
                <NavigationContainer>
                    <Tab.Navigator initialRouteName="Game" tabBar={(navigationProps) => <Navbar {...navigationProps} />}>
                        <Tab.Screen name="Game" component={Game} options={{ headerShown: false }} />
                        <Tab.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
                        <Tab.Screen name="Learn" component={Learn} options={{ headerShown: false }} />
                    </Tab.Navigator>
                </NavigationContainer>
            </SafeAreaView>
        </View>
	);
}

const styles = StyleSheet.create({
	appContainer: {
		flex: 1,
		backgroundColor: 'black',
	},
});