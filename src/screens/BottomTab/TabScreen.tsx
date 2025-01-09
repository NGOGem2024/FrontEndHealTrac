import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import HomeStackNavigator from "../HomeStackNavigator";
import PatientRegister from "../PatientRegister";
import DoctorProfileEdit from "../DoctorProfileUpdate";
import LogoutScreen from "./Logout";
import { RootTabParamList } from "../../types/types";
import { Keyboard } from "react-native";
import AllAppointmentsPage from "../AllAppointmen";
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator<RootTabParamList>();

const TabScreen: React.FC = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  return (
    <Tab.Navigator
      initialRouteName="HomeStackNavigator"
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarActiveBackgroundColor: "white",
        tabBarInactiveBackgroundColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: 60,
          paddingBottom: 5,
          display: isKeyboardVisible ? 'none' :'flex',
        },
        //tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="HomeStackNavigator"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AllAppointments"
        component={AllAppointmentsPage}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddPatient"
        component={PatientRegister}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="plus-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DoctorProfileEdit"
        component={DoctorProfileEdit}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
                  name="square-edit-outline"
                  size={size} color={color}
                />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabScreen;
