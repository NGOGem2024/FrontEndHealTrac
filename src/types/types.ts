import { StackNavigationProp } from "@react-navigation/stack";

export type RootStackParamList = {
  Register: undefined;
  Auth: undefined;
  UpdatePatient: { patientId?: string };
  PaitentRegister: undefined;
  Doctor: undefined;
  Patient: undefined;
  TherapyHistory: undefined;
  HomeStack: undefined;
  Tabs: undefined;
  Media: undefined;
  Report: undefined;
  AllPatients: undefined;
  UpdateTherapy: { patientId?: string };
};

export type RootStackNavProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
};
