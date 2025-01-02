import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
  BackHandler,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import { openBrowserAsync } from "expo-web-browser";
import { useSession } from "../context/SessionContext";
import axiosInstance from "../utils/axiosConfig";
import { RootStackParamList } from "../types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

interface AppointmentDetailsScreenProps {
  appointment: {
    plan_id: string;
    _id: string;
    patient_id: string;
    therepy_type: string;
    therepy_link?: string;
    therepy_start_time: string;
    therepy_date: string;
    patient_name?: string;
    doctor_name?: string;
  };
  onClose: () => void;
}

const AppointmentDetailsScreen: React.FC<AppointmentDetailsScreenProps> = ({
  appointment,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = createThemedStyles(theme);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { idToken } = useSession();
  const [isStarted, setIsStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [previousRemarks, setPreviousRemarks] = useState("");
  const [postRemarks, setPostRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [rotation] = useState(new Animated.Value(0));

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    onClose();
    return true;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && startTime) {
      interval = setInterval(() => {
        setElapsedTime(
          Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
        );
      }, 1000);

      // Start the rotation animation
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
    return () => {
      clearInterval(interval);
      rotation.setValue(0);
    };
  }, [isStarted, startTime, rotation]);

  const handleJoinSession = (joinUrl: string) => {
    openBrowserAsync(joinUrl);
  };

  const handleStart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/therapy/start/${appointment._id}`,
        {
          presession_remarks: previousRemarks,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        setIsStarted(true);
        setStartTime(new Date());
      } else {
        Alert.alert("Error", "Failed to start therapy session.");
      }
    } catch (error) {
      console.error("Failed to start therapy session:", error);
      Alert.alert("Error", "Failed to start therapy session.");
    } finally {
      setLoading(false);
    }
  }, [appointment._id, previousRemarks]);

  const handleCancel = () => {
    setPreviousRemarks("");
    onClose();
  };

  const handleShowEndModal = () => {
    setModalVisible(true);
  };

  const handleEnd = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        `/therapy/end/${appointment._id}`,
        {
          postsession_remarks: postRemarks,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        setModalVisible(false);
        onClose();
        navigation.navigate("payment", {
          planId: appointment.plan_id,
          patientId: appointment.patient_id,
        });
      } else {
        Alert.alert("Error", "Failed to end therapy session.");
      }
    } catch (error) {
      console.error("Failed to end therapy session:", error);
      Alert.alert("Error", "Failed to end therapy session.");
    } finally {
      setLoading(false);
    }
  }, [appointment._id, postRemarks]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Patient Info Card */}
      <View style={styles.patientInfoCard}>
        <View style={styles.patientInfoHeader}>
          <MaterialIcons name="person" size={24} color="#119FB3" />
          <Text style={styles.patientName}>{appointment.patient_name}</Text>
        </View>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <MaterialIcons name="event" size={20} color="#666" />
            <Text style={styles.dateTimeText}>
              {new Date(appointment.therepy_date).toDateString()}
            </Text>
          </View>
          <View style={styles.dateTimeItem}>
            <MaterialIcons name="access-time" size={20} color="#666" />
            <Text style={styles.dateTimeText}>
              {appointment.therepy_start_time}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {!isStarted ? (
          <View style={styles.contentContainer}>
            {/* Therapy Type Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons
                  name="medical-services"
                  size={20}
                  color="#119FB3"
                />
                <Text style={styles.cardTitle}>Therapy Type</Text>
              </View>
              <Text style={styles.cardContent}>{appointment.therepy_type}</Text>
            </View>

            {/* Doctor Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="person" size={20} color="#119FB3" />
                <Text style={styles.cardTitle}>Doctor</Text>
              </View>
              <Text style={styles.cardContent}>{appointment.doctor_name}</Text>
            </View>

            {/* Pre-Session Remarks */}
            <View style={styles.remarksSection}>
              <Text style={styles.remarksSectionTitle}>
                Pre-Session Remarks
              </Text>
              <TextInput
                style={styles.remarksInput}
                multiline
                numberOfLines={4}
                onChangeText={setPreviousRemarks}
                value={previousRemarks}
                placeholder="Enter previous session remarks"
                placeholderTextColor="#999"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.button, styles.startButton]}
                onPress={handleStart}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Start Therapy</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.sessionContainer}>
            {/* Timer Section */}
            <View style={styles.timerContainer}>
              <Animated.View style={styles.timerRing}>
                <View style={styles.timerInnerRing}>
                  <Text style={styles.timerText}>
                    {formatTime(elapsedTime)}
                  </Text>
                  <Text style={styles.timerLabel}>Session Duration</Text>
                </View>
              </Animated.View>
            </View>

            {/* Session Actions */}
            <View style={styles.sessionActions}>
              {appointment.therepy_link && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => handleJoinSession(appointment.therepy_link)}
                >
                  <MaterialIcons name="video-call" size={24} color="white" />
                  <Text style={styles.buttonText}>Join Session</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.endButton}
                onPress={handleShowEndModal}
              >
                <MaterialIcons name="stop" size={24} color="white" />
                <Text style={styles.buttonText}>End Therapy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* End Session Modal */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Post-Session Remarks</Text>
            <TextInput
              style={styles.remarksInput}
              multiline
              numberOfLines={4}
              onChangeText={setPostRemarks}
              value={postRemarks}
              placeholder="Enter post session remarks"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEnd}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcons name="check" size={20} color="white" />
                  <Text style={styles.buttonText}>Submit and End Session</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createThemedStyles = (theme: any) =>
  StyleSheet.create({
    actionButtonsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    button: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 8,
    },
    startButton: {
      backgroundColor: "#119FB3",
    },
    cancelButton: {
      backgroundColor: "#878787",
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },

    safeArea: {
      flex: 1,
      backgroundColor: theme.colors?.primary || "#f5f5f5",
    },
    header: {
      height: 56,
      backgroundColor: theme.colors?.primary || "#119FB3",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    backButton: {
      padding: 2,
    },
    headerTitle: {
      color: "white",
      fontSize: 20,
      fontWeight: "bold",
    },
    headerRight: {
      width: 40,
    },
    patientInfoCard: {
      backgroundColor: "white",
      margin: 16,
      borderRadius: 12,
      padding: 16,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    patientInfoHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    patientName: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 8,
      color: "#333",
    },
    dateTimeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dateTimeItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    dateTimeText: {
      marginLeft: 4,
      color: "#666",
      fontSize: 14,
    },
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
    },
    contentContainer: {
      padding: 16,
    },
    infoCard: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      color: "#119FB3",
    },
    cardContent: {
      fontSize: 16,
      color: "#333",
      marginLeft: 28,
    },
    remarksSection: {
      marginBottom: 24,
    },
    remarksSectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#333",
      marginBottom: 8,
    },
    remarksInput: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 12,
      height: 120,
      textAlignVertical: "top",
      fontSize: 16,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    actionButtons: {
      gap: 12,
    },
    uploadButton: {
      backgroundColor: "#90D5FF",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    uploadButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    sessionContainer: {
      padding: 24,
      alignItems: "center",
    },
    timerContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    timerRing: {
      width: 240,
      height: 240,
      borderRadius: 120,
      borderWidth: 12,
      borderColor: "#119FB3",
      justifyContent: "center",
      alignItems: "center",
    },
    timerInnerRing: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "white",
      justifyContent: "center",
      alignItems: "center",
    },
    timerText: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#119FB3",
      marginBottom: 4,
    },
    timerLabel: {
      fontSize: 14,
      color: "#666",
    },
    sessionActions: {
      width: "100%",
      gap: 16,
    },
    joinButton: {
      backgroundColor: "#4CAF50",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    endButton: {
      backgroundColor: "#FF6B6B",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      padding: 24,
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: 16,
      padding: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#333",
      marginBottom: 16,
      textAlign: "center",
    },
    modalButton: {
      backgroundColor: "#119FB3",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      gap: 8,
    },
  });

export default AppointmentDetailsScreen;
