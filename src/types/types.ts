import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export type RootStackParamList = {
  Register: undefined;
  Auth: undefined;
  CreateTherapyPlan: { patientId?: string };
  UpdatePatient: { patientId?: string };
  PatientRegister: undefined;
  Doctor: { doctorId?: string };
  Patient: undefined;
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
  AppointmentDetails: { appointment: any };
  AppointmentDetailsScreen: { appointment: any };
  UpdateDoctor: { doctorId?: string };
  HomeStackNavigator: undefined;
  TodaysAppointments: undefined;
  AllDoctors: undefined;
  SearchPatients: undefined;
};

export type RootTabParamList = {
  HomeStackNavigator: undefined;
  AddPatient: undefined;
  DoctorProfileEdit: undefined;
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};

export type RootTabNavProps<T extends keyof RootTabParamList> = {
  navigation: BottomTabNavigationProp<RootTabParamList, T>;
};
