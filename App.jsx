import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TabScreen from "./src/screens/BottomTab/TabScreen";
import SplashScreen from "./src/screens/SplashScreen";
import Auth from "./src/components/Auth";
import { SessionProvider, useSession } from "./src/context/SessionContext";
import { ThemeProvider } from "./src/screens/ThemeContext";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const Stack = createStackNavigator();

function MainNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator>
      {session.isLoggedIn ? (
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
    <SessionProvider>
      <ThemeProvider>
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      </ThemeProvider>
      <Toast />
    </SessionProvider>
  );
}
