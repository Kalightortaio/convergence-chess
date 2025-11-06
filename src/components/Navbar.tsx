import { TouchableOpacity, View, Text, StyleSheet } from "react-native"
import SVGLoader from "./SVGLoader"
import { cellSize, scaleText } from "../Constants";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export default function Navbar({ state, navigation }: BottomTabBarProps) {
    const activeRoute = state.routes[state.index].name;
    const activeColor = 'skyblue';
    const tabs = [
        { name: 'Game', label: 'Play', icon: 'board' },
        { name: 'Profile', label: 'Profile', icon: 'profile' },
        { name: 'Learn', label: 'Learn', icon: 'cap' },
    ];

    return (
        <View style={styles.navBar}>
            {tabs.map((tab) => {
                const isActive = activeRoute === tab.name;
                return (
                <View key={tab.name} style={styles.navTab}>
                    <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate(tab.name)}>
                        <SVGLoader type="ui" name={tab.icon} leftColor={isActive ? activeColor : 'white'} style={styles.navSVG}/>
                        <Text style={[styles.navText, isActive && { color: activeColor }]}>{tab.label}</Text>
                    </TouchableOpacity>
                </View>
                );
            })}
        </View>
    )
}

const styles = StyleSheet.create({
	navBar: {
		height: cellSize * 2.5,
		width: '100%',
		backgroundColor: 'black',
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
	},
	navText: {
		 color: 'white', 
		 fontFamily: 'ComicSansMS',
		 fontSize: scaleText(12),
	},
	navTab: {
		flexDirection: 'column',
		width: '33%',
		justifyContent: 'center',
		alignItems: 'center',
	},
    navButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        flex: 1,
    },
	navSVG: { 
	    maxHeight: cellSize * 1.25,
        aspectRatio: 1,
	},
    activeTab: {
        backgroundColor: 'red',
    },
});