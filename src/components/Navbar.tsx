import { TouchableOpacity, View, Text, StyleSheet } from "react-native"
import SVGLoader from "./SVGLoader"
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../Types";
import { cellSize, scaleText } from "../Constants";

export default function Navbar() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    return (
        <View style={styles.navBar} >
            <View style={styles.navTab}>
                <TouchableOpacity onPress={() => {navigation.navigate('Game')}}>
                    <SVGLoader type="ui" name="board" style={styles.navSVG} />
                    <Text style={styles.navText}>Play</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.navTab}>
                <TouchableOpacity onPress={() => {navigation.navigate('Profile')}}>
                    <SVGLoader type="ui" name="profile" style={styles.navSVG} />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.navTab}>
                <TouchableOpacity onPress={() => {navigation.navigate('Learn')}}>
                    <SVGLoader type="ui" name="cap" style={styles.navSVG} />
                    <Text style={styles.navText}>Learn</Text>
                </TouchableOpacity>
            </View>
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
	navSVG: { 
	    maxHeight: cellSize * 1.25,
        aspectRatio: 1,
	},
});