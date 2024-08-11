import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export type RootStackParamList = {
  Register: undefined;
  Auth: undefined;
  UpdatePatient: { patientId?: string };
  PatientRegister: undefined;
  Doctor: undefined;
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
  HomeStackNavigator: undefined;
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
