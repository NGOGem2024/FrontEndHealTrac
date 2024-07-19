import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ThemeProvider } from "./src/screens/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabScreen from "./src/screens/BottomTab/TabScreen";
import SplashScreen from "./src/screens/SplashScreen";
import Auth from "./src/components/Auth";
import {
  SessionContextProvider,
  useSession,
} from "./src/context/SessionContext";

const Stack = createStackNavigator();

function MainNavigator() {
  const { session, setSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem("userSession");
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [setSession]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {session ? (
        <Stack.Screen
          name="TabScreen"
          component={TabScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={Auth}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SessionContextProvider>
      <ThemeProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SessionContextProvider>
  );
}
