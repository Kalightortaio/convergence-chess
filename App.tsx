import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeAreaApp from "./src/screens/SafeAreaApp";

export default function App() {
    const[fontsLoaded] = useFonts({
      ComicSansMS: require("./assets/fonts/ComicSansMS.ttf"),
    });

    if (!fontsLoaded) {
      return null;
    }

    return (
		<GestureHandlerRootView>
			<SafeAreaProvider>
				<SafeAreaApp />
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
  }