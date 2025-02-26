import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export type RootStackParamList = {
  Register: undefined;
  Auth: undefined;
  CreateTherapyPlan: { patientId?: string };
  UpdatePatient: { patientId?: string };
  PatientRegister: undefined;
  Doctor: { doctorId?: string };
  Patient: { patientId?: string };
  TherapyHistory: undefined;
  HomeStack: undefined;
  Tabs: undefined;
  Media: undefined;
  Report: undefined;
  AllPatients: undefined;
  UpdateTherapy: { patientId?: string };
  CreateTherapy: { patientId?: string };
  DoctorDashboard: undefined;
  DoctorProfileEdit: undefined;
  DoctorRegister: undefined;
  TabScreen: {
    screen?: keyof RootTabParamList;
    params?: object;
  };
  planDetails: { planId?: string };
  Settings: undefined;
  EditTherapyPlan: { planId?: string };
  AppointmentDetails: { appointment: any };
  AppointmentDetailsScreen: { appointment: any };
  UpdateDoctor: { doctorId?: string };
  therapySessions: { planId?: string };
  HomeStackNavigator: undefined;
  TodaysAppointments: undefined;
  AllDoctors: undefined;
  SearchPatients: undefined;
  AllAppointments: undefined;
  payment: { planId?: string; patientId?: string };
  MyPatient: undefined;
};

export type RootTabParamList = {
  HomeStackNavigator: undefined;
  AddPatient: undefined;
  DoctorProfileEdit: undefined;
  Dashboard: undefined; // Add this for the DoctorDashboard screen
  AllPatients: undefined;
  MainStack: undefined;
  AllAppointments: undefined;
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};

export type RootTabNavProps<T extends keyof RootTabParamList> = {
  navigation: BottomTabNavigationProp<RootTabParamList, T>;
};
