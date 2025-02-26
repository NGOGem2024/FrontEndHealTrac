import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../types/types";
import {
  MaterialIcons,
  AntDesign,
  Octicons,
  FontAwesome,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Title, Card } from "react-native-paper";
import { useSession } from "../../context/SessionContext";
import { handleError } from "../../utils/errorHandler";
import BackTopTab from "../BackTopTab";
import axiosInstance from "../../utils/axiosConfig";
import { useTheme } from "../ThemeContext";
import { getTheme } from "../Theme";
import LoadingScreen from "../../components/loadingScreen";

type PatientScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Patient">;
  route: { params: { patientId: string; preloadedData?: any } };
};

interface TherapyPlan {
  therapy_name: string;
  patient_diagnosis: string;
  patient_symptoms: string;
  therapy_duration: string;
  therapy_end: string;
  therapy_start: string;
  patient_therapy_category: string;
  total_amount: string;
  received_amount: string;
  balance: string;
  estimated_sessions: string;
  therapy_sessions: string;
  _id: string;
}

interface PatientData {
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  patient_phone: string;
  patient_id: string;
  patient_address1: string;
  therapy_plans: TherapyPlan[];
  doctor_name: string;
}

const calculateTherapyProgress = (therapyPlan: TherapyPlan): number => {
  try {
    // Guard clause - return 0 if plan doesn't exist or is invalid
    if (!therapyPlan) return 0;

    // Check if therapy_sessions exists and is an array
    if (
      !therapyPlan.therapy_sessions ||
      !Array.isArray(therapyPlan.therapy_sessions)
    ) {
      return 0;
    }

    // Check if estimated_sessions exists and is a valid number
    if (
      !therapyPlan.estimated_sessions ||
      typeof therapyPlan.estimated_sessions !== "number" ||
      therapyPlan.estimated_sessions <= 0
    ) {
      return 0;
    }

    // Safely count completed sessions
    const completedSessions = therapyPlan.therapy_sessions.filter(
      (session) => session && session.status === "Completed"
    ).length;

    // Calculate progress percentage
    const progress = (completedSessions / therapyPlan.estimated_sessions) * 100;

    // Ensure progress is between 0 and 100 and is a valid number
    return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;
  } catch (error) {
    // If anything goes wrong, return 0 instead of breaking
    console.warn("Error calculating therapy progress:", error);
    return 0;
  }
};
const PatientScreen: React.FC<PatientScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme));
  const { session } = useSession();
  const { patientId } = route.params;
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fetchPatientData = async (showLoadingIndicator = true) => {
    if (!session.idToken) return;

    try {
      if (showLoadingIndicator) {
        setIsRefreshing(true);
      }

      const response = await axiosInstance.get(`/patient/${patientId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.idToken,
        },
      });

      setPatientData(response.data.patientData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchPatientData(true);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await fetchPatientData(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    const unsubscribe = navigation.addListener("focus", () => {
      fetchPatientData(true);
    });

    return unsubscribe;
  }, [patientId, session.idToken, navigation]);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
      </View>
    );
  }

  if (!patientData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Patient not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTopTab screenName="Patient" />
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007B8E']} // Android
            tintColor='#007B8E' // iOS
          />
        }
      >
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.patientName}>
              {patientData.patient_first_name} {patientData.patient_last_name}
            </Text>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate("UpdatePatient", {
                  patientId: patientId,
                })
              }
            >
              <MaterialCommunityIcons
                name="square-edit-outline"
                size={24}
                color='#007B8E'
              />
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            {patientData.patient_email && (
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color='#007B8E' />
                <Text style={styles.infoText}>{patientData.patient_email}</Text>
              </View>
            )}
            {patientData?.doctor_name && (
              <View style={styles.infoRow}>
                <FontAwesome name="user-md" size={20} color='#007B8E' />
                <Text style={styles.infoText}>{patientData.doctor_name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <MaterialIcons name="call" size={20} color='#007B8E' />
              <Text style={styles.infoText}>{patientData.patient_phone}</Text>
            </View>
            {patientData.patient_address1 && (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={20} color='#007B8E' />
                <Text style={styles.infoText}>
                  {patientData.patient_address1}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate("CreateTherapyPlan", {
                  patientId: patientId,
                })
              }
            >
              <Ionicons name="clipboard" size={24} color="#6A0DAD" />
              <Text style={styles.quickActionText}>Create Therapy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate("CreateTherapy", {
                  patientId: patientId,
                })
              }
            >
              <MaterialCommunityIcons name="file" size={24} color="#6e54ef" />
              <Text style={styles.quickActionText}>Book Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate("UpdateTherapy", {
                  patientId: patientId,
                })
              }
            >
              <Ionicons name="medical" size={24} color="#55b55b" />
              <Text style={styles.quickActionText}>Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isRefreshing && (
          <View style={styles.refreshLoadingContainer}>
            <ActivityIndicator size="small" color="black" />
          </View>
        )}
        {patientData.therapy_plans && patientData.therapy_plans.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Therapy Plans</Text>
            {patientData.therapy_plans
              .slice()
              .reverse()
              .map((plan, index) => {
                const progressPercentage = calculateTherapyProgress(plan);

                return (
                  <TouchableOpacity
                    key={plan._id}
                    onPress={() =>
                      navigation.navigate("planDetails", { planId: plan._id })
                    }
                    style={styles.therapyPlanItem}
                  >
                    <View style={styles.therapyPlanHeader}>
                      <Text style={styles.therapyPlanTitle}>
                        {index === 0
                          ? "Current Plan"
                          : `Past Plan ${index + 1}`}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate("EditTherapyPlan", {
                            planId: plan._id,
                          });
                        }}
                      >
                        <MaterialCommunityIcons
                          name="square-edit-outline"
                          size={24}
                          color='#007B8E'
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.therapyPlanName}>
                      {plan.therapy_name}
                    </Text>
                    <View style={styles.therapyPlanDetails}>
                      <Text style={styles.therapyPlanDetailText}>
                        {plan.patient_diagnosis}
                      </Text>
                      <Text style={styles.therapyPlanDetailText}>
                        {new Date(plan.therapy_start).toLocaleDateString()} -{" "}
                        {new Date(plan.therapy_end).toLocaleDateString()}
                      </Text>

                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            { width: `${progressPercentage}%` },
                          ]}
                        />
                        <Text style={styles.progressText}>
                          {`${Math.round(progressPercentage)}% Complete`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    therapyPlanDetails: {
      flexDirection: "column",
    },
    progressContainer: {
      marginTop: 8,
      height: 20,
      backgroundColor: "#E0E0E0",
      borderRadius: 10,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
    },
    refreshLoadingContainer: {
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#007B8E",
      borderRadius: 10,
    },
    progressText: {
      position: "absolute",
      width: "100%",
      textAlign: "center",
      fontSize: 12,
      color: "white",
      fontWeight: "bold",
    },
    therapyPlanDetailText: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    safeArea: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    container: {
      flex: 1,
      backgroundColor: '#007B8E',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: '#007B8E',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: "#FFFFFF",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: '#007B8E',
    },
    errorText: {
      color: "#FFFFFF",
      fontSize: 16,
    },
    mainCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginBottom: 8,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    patientName: {
      fontSize: 24,
      fontWeight: "bold",
      color: '#007B8E',
    },
    contactInfo: {
      marginTop: 8,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    infoText: {
      marginLeft: 8,
      fontSize: 14,
      color: theme.colors.text,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 12,
    },
    quickActionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    quickActionButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    quickActionText: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.text,
    },
    therapyPlanItem: {
      backgroundColor: "rgb(240, 246, 255)",
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    therapyPlanHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    therapyPlanTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: '#007B8E',
    },
    therapyPlanName: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
    },
  });

export default PatientScreen;
