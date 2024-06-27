import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import TabScreen from "./src/screens/BottomTab/TabScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { SessionContextProvider } from "./src/context/SessionContext"; // Adjust the path if necessary

const Stack = createStackNavigator();

export default function App() {
  return (
    <SessionContextProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SplashScreen">
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TabScreen"
            component={TabScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SessionContextProvider>
  );
}
