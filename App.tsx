import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Game from './src/screens/Game';

export default function App() {
	StatusBar.setHidden(false);
	
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Game />
		</GestureHandlerRootView>
	);
}