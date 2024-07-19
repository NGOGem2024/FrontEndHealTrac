import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Octicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeStackNavigator from "../HomeStackNavigator";
import PatientRegister from "../PatientRegister";
import UpdatePatient from "../UpdatePatient";
import { useSession } from "../../context/SessionContext"; // Adjust the path if necessary
import { RootTabParamList, RootStackParamList } from "../../types/types"; // Adjust the path if necessary
import { StackNavigationProp } from "@react-navigation/stack";
import DoctorProfileEdit from "../DoctorProfileUpdate";

const Tab = createBottomTabNavigator<RootTabParamList>();

type LogoutNavigationProp = StackNavigationProp<RootStackParamList, "Auth">;

const LogoutButton = () => {
  const { logout } = useSession();
  const navigation = useNavigation<LogoutNavigationProp>();

  const handleLogout = async () => {
    await logout();
    navigation.navigate("Auth");
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ paddingRight: 15 }}>
      <Octicons name="sign-out" size={24} color="black" />
    </TouchableOpacity>
  );
};

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
        name="DoctorProfileEdit"
        component={DoctorProfileEdit}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Octicons name="people" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutButton}
        options={{
          tabBarIcon: ({ color }) => (
            <Octicons name="sign-out" size={30} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabScreen;
