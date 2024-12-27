import { StyleSheet } from "react-native";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Auth from "../components/Auth";
import AllPatients from "./AllPatients";
import PatientRegister from "./PatientRegister";
import UpdatePatient from "./UpdatePatient";
import PatientScreen from "./BottomTab/PatientScreen";
import TherapyScreen from "./BottomTab/TherapyHistory";
import TherapyTable from "./UpdateTherapy";
import TabScreen from "./BottomTab/TabScreen";
import CreateTherapy from "../screens/BottomTab/CreateTherapy";
import DoctorDashboard from "./DoctorDashboard";
import DoctorProfileEdit from "./DoctorProfileUpdate";
import LogoutScreen from "./BottomTab/Logout";
import DoctorRegister from "./Doctorreg";
import AllDoctors from "./AllDoctors";
import CreateTherapyPlan from "./Therapyplan";
import DoctorScreen from "./doctorScreen";
import EditDoctor from "./updatedoc";
import SearchPatients from "./searchpatient";
import AppointmentDetailsScreen from "./AppointmentDetails";
import SettingsScreen from "./settings";
import EditTherapyPlan from "./editPlan";
import TherapyPlanDetails from "./planDetails";
import PaymentDetailsScreen from "./paymentpage";
import AllAppointmentsScreen from "./AllAppointmentsScreen";

const Stack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="DoctorDashboard">
      <Stack.Screen
        name="DoctorDashboard"
        component={DoctorDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllPatients"
        component={AllPatients}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTherapyPlan"
        component={CreateTherapyPlan}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditTherapyPlan"
        component={EditTherapyPlan}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Auth"
        component={Auth}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="planDetails"
        component={TherapyPlanDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="payment"
        component={PaymentDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PatientRegister"
        component={PatientRegister}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Logout"
        component={LogoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DoctorProfileEdit"
        component={DoctorProfileEdit}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchPatients"
        component={SearchPatients}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllDoctors"
        component={AllDoctors}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdatePatient"
        component={UpdatePatient}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Patient"
        component={PatientScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateTherapy"
        component={CreateTherapy}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TherapyHistory"
        component={TherapyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateTherapy"
        component={TherapyTable}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DoctorRegister"
        component={DoctorRegister}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Doctor"
        component={DoctorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UpdateDoctor"
        component={EditDoctor}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AllAppointments"
        component={AllAppointmentsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default HomeStackNavigator;

const styles = StyleSheet.create({});
