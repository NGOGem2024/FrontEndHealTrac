import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Octicons } from "@expo/vector-icons";
import HomeStackNavigator from "../HomeStackNavigator";
import PatientRegister from "../PatientRegister";
import UpdatePatient from "../UpdatePatient";

const Tab = createBottomTabNavigator();

const TabScreen: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Patient"
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "black",
        tabBarActiveBackgroundColor: "white",
        tabBarInactiveBackgroundColor: "white",
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Patient"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Octicons name="home" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddPatient"
        component={PatientRegister}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Octicons name="plus-circle" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UpdatePatient"
        component={UpdatePatient}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Octicons name="people" size={30} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabScreen;
