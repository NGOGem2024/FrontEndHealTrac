import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import axiosInstance from "../utils/axiosConfig";
import { useSession } from "../context/SessionContext";
import { handleError } from "../utils/errorHandler";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/types";
import BackTabTop from "./BackTopTab";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import LoadingScreen from "../components/loadingScreen";

// Define proper interfaces
interface SessionRemark {
  doctor_name: string;
  presession_remark?: string;
  postsession_remarks?: string;
  timestamp: string;
}

interface Addon {
  name: string;
  amount: number;
}

interface TherapySession {
  _id: string;
  status: string;
}

interface TherapyPlanDetails {
  therapy_plan: {
    _id: string;
    therapy_name: string;
    patient_id: string;
    patient_diagnosis: string;
    patient_symptoms: string[] | string;
    therapy_duration: string;
    therapy_end: string;
    therapy_start: string;
    patient_therapy_category: string;
    total_amount: number | string;
    received_amount: string;
    balance: string;
    extra_addons?: string[] | Array<{ name: string; amount: number }>;
    addons_amount?: number | string;
    therapy_sessions?: TherapySession[];
    estimated_sessions?: number;
    presession_remarks?: SessionRemark[];
    postsession_remarks?: SessionRemark[];
  };
  patient_name: string;
}
type TherapyPlanDetailsRouteProp = RouteProp<RootStackParamList, "planDetails">;
type TherapyNavigationProp = StackNavigationProp<RootStackParamList>;

// Separate components for better organization

const TherapyPlanDetails: React.FC = () => {
  const route = useRoute<TherapyPlanDetailsRouteProp>();
  const navigation = useNavigation<TherapyNavigationProp>();
  const { theme } = useTheme();
  const styles = getStyles(getTheme(theme));
  const { session } = useSession();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<TherapyPlanDetails | null>(
    null
  );
  const { planId } = route.params;
  const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width: `${progress}%` }]} />
    </View>
  );

  const RemarkItem: React.FC<{
    doctor_name: string;
    remark: string;
    timestamp: string;
  }> = ({ doctor_name, remark, timestamp }) => (
    <View style={styles.remarkItem}>
      <View style={styles.remarkHeader}>
        <Text style={styles.doctorName}>{doctor_name}</Text>
        <Text style={styles.timestamp}>
          {new Date(timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.remarkText}>{remark}</Text>
    </View>
  );
  useEffect(() => {
    fetchPlanDetails();
    const fetchPlanDetails1 = async () => {
      try {
        const response = await axiosInstance.get(`/get/plan/${planId}`, {
          headers: { Authorization: `Bearer ${session.idToken}` },
        });
        setPatientId(response.data.patient_id);
        setPlanDetails(response.data);
      } catch (error) {
        handleError(error);
      }
    };
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPlanDetails1();
    });

    return unsubscribe;
  }, [planId, navigation]);

  const fetchPlanDetails = async () => {
    if (!session.idToken || !planId) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get/plan/${planId}`, {
        headers: { Authorization: `Bearer ${session.idToken}` },
      });
      setPatientId(response.data.patient_id);
      setPlanDetails(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTherapyProgress = (
    therapyPlan: TherapyPlanDetails["therapy_plan"]
  ): number => {
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
      const progress =
        (completedSessions / therapyPlan.estimated_sessions) * 100;

      // Ensure progress is between 0 and 100 and is a valid number
      return Number.isFinite(progress)
        ? Math.min(Math.max(progress, 0), 100)
        : 0;
    } catch (error) {
      // If anything goes wrong, return 0 instead of breaking
      console.warn("Error calculating therapy progress:", error);
      return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
      </View>
    );
  }

  const renderSessionsCard = () => {
    if (!plan.estimated_sessions && !plan.therapy_sessions) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sessions Information</Text>

        <View style={styles.sessionsContainer}>
          {plan.estimated_sessions !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Estimated Sessions:</Text>
              <Text style={styles.value}>{plan.estimated_sessions}</Text>
            </View>
          )}

          {plan.therapy_sessions && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Completed Sessions:</Text>
                <Text style={styles.value}>
                  {
                    plan.therapy_sessions.filter(
                      (session) => session.status === "Completed"
                    ).length
                  }
                </Text>
              </View>

              <Text style={[styles.sectionTitle, styles.sessionListTitle]}>
                Session Details
              </Text>

              {plan.therapy_sessions.map((session, index) => (
                <TouchableOpacity
                  key={session._id}
                  style={styles.sessionItem}
                  onPress={() =>
                    navigation.navigate("therapySessions", {
                      planId: plan._id,
                    })
                  }
                >
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionNumber}>
                      Session {index + 1}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            session.status === "Completed"
                              ? "#4CAF50"
                              : "#FFA726",
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>{session.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </View>
    );
  };
  if (!planDetails?.therapy_plan) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  const plan = planDetails.therapy_plan;
  const progress = calculateTherapyProgress(plan);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Plan Details" />
      <StatusBar
        barStyle="light-content"
        backgroundColor="black"
        translucent={false}
      />

      <ScrollView style={styles.container}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Patient", { patientId: patientId })
              }
            >
              <Text style={styles.patientName}>{planDetails.patient_name}</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() =>
                  navigation.navigate("CreateTherapy", {
                    patientId: patientId,
                  })
                }
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={24}
                  color='#007B8E'
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate("EditTherapyPlan", {
                    planId: plan._id,
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
          </View>
          <Text style={styles.therapyName}>{plan.therapy_name}</Text>
          <Text style={styles.category}>{plan.patient_therapy_category}</Text>

          <View style={styles.progressContainer}>
            <ProgressBar progress={progress} />
            <Text style={styles.duration}>
              Duration: {plan.therapy_duration}
            </Text>
          </View>

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>
              Start: {new Date(plan.therapy_start).toLocaleDateString()}
            </Text>
            <Text style={styles.dateText}>
              End: {new Date(plan.therapy_end).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Diagnosis:</Text>
            <Text style={styles.value}>{plan.patient_diagnosis}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Symptoms:</Text>
            <Text style={styles.value}>
              {Array.isArray(plan.patient_symptoms)
                ? plan.patient_symptoms.join(", ")
                : plan.patient_symptoms}
            </Text>
          </View>
        </View>
        {renderSessionsCard()}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <TouchableOpacity
              style={styles.paymentInfoButton}
              onPress={() =>
                navigation.navigate("payment", {
                  planId: planId,
                  patientId: patientId,
                })
              }
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color='#007B8E'
              />
            </TouchableOpacity>
          </View>
          <View style={styles.paymentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Amount:</Text>
              <Text style={styles.value}>₹{plan.total_amount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Received:</Text>
              <Text style={styles.value}>₹{plan.received_amount}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Balance:</Text>
              <Text style={[styles.value, styles.balance]}>
                ₹{plan.balance}
              </Text>
            </View>
            {plan.extra_addons && plan.extra_addons.length > 0 && (
              <View style={styles.extraAddonsSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Extra Addons:</Text>
                </View>
                {plan.extra_addons.map((addon, index) => (
                  <View key={index} style={styles.addonRow}>
                    <Text style={styles.addonName}>{addon.name}</Text>
                    <Text style={styles.addonAmount}>₹{addon.amount}</Text>
                  </View>
                ))}
                {plan.addons_amount && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Total Addons Amount:</Text>
                    <Text style={styles.value}>₹{plan.addons_amount}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {(plan.presession_remarks?.some((r) => r.presession_remark) ||
          plan.postsession_remarks?.some((r) => r.postsession_remarks)) && (
          <View style={[styles.card, styles.lastCard]}>
            <Text style={styles.sectionTitle}>Session Remarks</Text>

            {plan.presession_remarks?.some((r) => r.presession_remark) && (
              <View style={styles.remarkSection}>
                <Text style={styles.remarkSectionTitle}>
                  Pre-session Remarks
                </Text>
                {plan.presession_remarks
                  .filter((remark) => remark.presession_remark)
                  .map((remark, index) => (
                    <RemarkItem
                      key={`pre-${index}`}
                      doctor_name={remark.doctor_name}
                      remark={remark.presession_remark || ""}
                      timestamp={remark.timestamp}
                    />
                  ))}
              </View>
            )}

            {plan.postsession_remarks?.some((r) => r.postsession_remarks) && (
              <View style={styles.remarkSection}>
                <Text style={styles.remarkSectionTitle}>
                  Post-session Remarks
                </Text>
                {plan.postsession_remarks
                  .filter((remark) => remark.postsession_remarks)
                  .map((remark, index) => (
                    <RemarkItem
                      key={`post-${index}`}
                      doctor_name={remark.doctor_name}
                      remark={remark.postsession_remarks || ""}
                      timestamp={remark.timestamp}
                    />
                  ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    remarkSection: {
      marginBottom: 16,
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    sessionsContainer: {
      backgroundColor:
        theme.colors.card === "#FFFFFF"
          ? "rgb(240, 246, 255)"
          : "rgba(17, 159, 179, 0.1)",
      padding: 16,
      borderRadius: 8,
    },
    sessionListTitle: {
      fontSize: 16,
      marginTop: 16,
      marginBottom: 8,
    },
    sessionItem: {
      borderLeftWidth: 2,
      borderLeftColor: '#007B8E',
      paddingLeft: 12,
      marginBottom: 12,
    },
    sessionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sessionNumber: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "500",
    },
    iconButton: {
      padding: 8,
      marginLeft: 8,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    extraAddonsSection: {
      marginTop: 8,
      backgroundColor: "rgba(17, 159, 179, 0.05)",
      borderRadius: 8,
      padding: 8,
    },
    addonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    addonName: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    addonAmount: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
    },
    remarkSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: '#007B8E',
      marginBottom: 12,
      marginTop: 8,
    },

    paymentInfoButton: {
      padding: 8,
      marginLeft: 8,
    },
    editButton: {
      padding: 8,
      marginLeft: 8,
    },
    remarkItem: {
      marginBottom: 16,
      borderLeftWidth: 2,
      borderLeftColor:'#007B8E',
      paddingLeft: 12,
    },
    remarkHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    doctorName: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.text,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    remarkText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: '#007B8E',
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
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
    lastCard: {
      marginBottom: 16,
    },
    therapyName: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    patientName: {
      fontSize: 18,
      color: '#007B8E',
      marginBottom: 4,
    },
    category: {
      fontSize: 16,
      color: '#007B8E',
      marginBottom: 16,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 4,
      backgroundColor: "#E0E0E0",
      borderRadius: 2,
      marginBottom: 4,
    },
    progressFill: {
      height: "100%",
      backgroundColor: '#007B8E',
      borderRadius: 2,
    },
    duration: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    dateInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: "500",
      flex: 1,
      textAlign: "right",
      marginLeft: 8,
    },
    balance: {
      color: '#007B8E',
      fontWeight: "bold",
    },
    paymentInfo: {
      backgroundColor: "rgb(240, 246, 255)",
      padding: 12,
      borderRadius: 8,
    },

    remarkLabel: {
      fontSize: 14,
      color: '#007B8E',
      marginBottom: 4,
    },
  });

export default TherapyPlanDetails;
