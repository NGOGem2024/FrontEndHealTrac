import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import { useSession } from "../context/SessionContext";
import axiosInstance from "../utils/axiosConfig";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";

type PaymentPageProps = {
  navigation: StackNavigationProp<RootStackParamList, "payment">;
  route: {
    params: { planId: string; patientId?: string; preloadedData?: any };
  };
};
interface Addon {
  name: string;
  amount: number;
}
interface PaymentInfo {
  therapy_name: string;
  payment_summary: {
    total_amount: number;
    received_amount: number;
    balance: number;
    addons_amount: number;
  };
  session_info: {
    per_session_amount: number;
    estimated_sessions: number;
    completed_sessions: number;
    remaining_sessions: number;
  };
  payment_structure: {
    payment_type: string;
    next_payment_due: string;
  };
  addons: Array<any>;
  payment_history: Array<{
    amount: number;
    date: string;
    type: string;
    session_number: number;
  }>;
}

const PaymentDetailsScreen: React.FC<PaymentPageProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { planId, patientId } = route.params;
  const styles = getStyles(getTheme(theme));
  const { idToken } = useSession();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);

  useEffect(() => {
    fetchPaymentInfo();
  }, []);
  interface PaymentModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (amount: number, type: string, addons?: Addon[]) => void;
    currentSession: number;
  }

  const PaymentModal: React.FC<PaymentModalProps> = ({
    visible,
    onClose,
    onSubmit,
    currentSession,
  }) => {
    const [amount, setAmount] = useState<string>("");
    const [paymentType, setPaymentType] = useState("CASH");
    const [addonInput, setAddonInput] = useState<string>("");
    const [addonAmount, setAddonAmount] = useState<string>("");
    const [addons, setAddons] = useState<Addon[]>([]);

    // Update amount when the modal becomes visible
    useEffect(() => {
      if (visible && paymentInfo?.session_info?.per_session_amount) {
        setAmount(paymentInfo.session_info.per_session_amount.toString());
      } else {
        setAmount(""); // Set to empty string if no amount is available
      }
    }, [visible, paymentInfo]);
    const handleAddAddon = () => {
      // Validate addon input
      if (!addonInput.trim().startsWith("#")) {
        Alert.alert("Error", "Addon name must start with #");
        return;
      }

      const numAddonAmount = parseFloat(addonAmount);
      if (isNaN(numAddonAmount) || numAddonAmount <= 0) {
        Alert.alert("Error", "Please enter a valid addon amount");
        return;
      }

      // Add addon to list
      const newAddon: Addon = {
        name: addonInput.trim(),
        amount: numAddonAmount,
      };

      setAddons([...addons, newAddon]);

      // Reset addon input fields
      setAddonInput("");
      setAddonAmount("");
    };
    const handleRemoveAddon = (index: number) => {
      const updatedAddons = addons.filter((_, i) => i !== index);
      setAddons(updatedAddons);
    };
    const handleSubmit = () => {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        Alert.alert("Error", "Please enter a valid amount");
        return;
      }

      onSubmit(numAmount, paymentType, addons);

      // Reset all fields
      setAmount("");
      setPaymentType("CASH");
      setAddons([]);
    };

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.modalSubtitle}>
              Session {currentSession + 1}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Addon Input Section */}
            <View style={styles.addonContainer}>
              <TextInput
                style={styles.addonInput}
                placeholder="#Addon Name"
                value={addonInput}
                onChangeText={setAddonInput}
              />
              <TextInput
                style={styles.addonAmountInput}
                placeholder="Amount"
                keyboardType="numeric"
                value={addonAmount}
                onChangeText={setAddonAmount}
              />
              <TouchableOpacity
                style={styles.addAddonButton}
                onPress={handleAddAddon}
              >
                <Text style={styles.addAddonButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Addons List */}
            {addons.map((addon, index) => (
              <View key={index} style={styles.addonListItem}>
                <Text style={styles.addonListItemText}>
                  {addon.name} - ₹{addon.amount}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveAddon(index)}
                  style={styles.removeAddonButton}
                >
                  <Text style={styles.removeAddonButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.paymentTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  paymentType === "CASH" && styles.selectedTypeButton,
                ]}
                onPress={() => setPaymentType("CASH")}
              >
                <Text style={styles.typeButtonText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  paymentType === "ONLINE" && styles.selectedTypeButton,
                ]}
                onPress={() => setPaymentType("ONLINE")}
              >
                <Text style={styles.typeButtonText}>Online</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const fetchPaymentInfo = async () => {
    try {
      setError(null);
      const response = await axiosInstance.get(`/get/paymentinfo/${planId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.status === 200 && response.data) {
        setPaymentInfo(response.data);
      } else {
        setError("Failed to fetch payment details.");
        Alert.alert("Error", "Failed to fetch payment details.");
      }
    } catch (error) {
      console.error("Failed to fetch payment info:", error);
      setError("Failed to fetch payment details.");
      Alert.alert("Error", "Failed to fetch payment details.");
    } finally {
      setLoading(false);
    }
  };
  const handleRecordPayment = async (
    amount: number,
    type: string,
    addons: Addon[] = []
  ) => {
    try {
      setLoading(true);
      const currentSession = paymentInfo?.session_info.completed_sessions || 0;

      const response = await axiosInstance.post(
        `/put/payment/${planId}`,
        {
          amount,
          type,
          session_number: currentSession + 1,
          addon_services: addons.map((addon) => ({
            name: addon.name,
            amount: addon.amount,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Payment recorded successfully");
        await fetchPaymentInfo(); // Refresh payment info
      } else {
        Alert.alert("Error", "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      Alert.alert("Error", "Failed to record payment");
    } finally {
      setLoading(false);
      setIsPaymentModalVisible(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
      </View>
    );
  }

  if (error || !paymentInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "Failed to load payment details"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPaymentInfo}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerText}>Payment Details</Text>

      {/* Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{paymentInfo.therapy_name}</Text>
        <View style={styles.rowContainer}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(paymentInfo.payment_summary.total_amount)}
            </Text>
          </View>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountValue, { color: "#e74c3c" }]}>
              {formatCurrency(paymentInfo.payment_summary.balance)}
            </Text>
          </View>
        </View>
        {paymentInfo.payment_summary.addons_amount > 0 && (
          <View style={styles.addonsContainer}>
            <Text style={styles.addonsLabel}>Additional Services</Text>
            <Text style={styles.addonsValue}>
              {formatCurrency(paymentInfo.payment_summary.addons_amount)}
            </Text>
          </View>
        )}
      </View>

      {/* Session Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Session Information</Text>
        <View style={styles.sessionGrid}>
          <View style={styles.sessionItem}>
            <Text style={styles.sessionLabel}>Total Sessions</Text>
            <Text style={styles.sessionValue}>
              {paymentInfo.session_info.estimated_sessions}
            </Text>
          </View>
          <View style={styles.sessionItem}>
            <Text style={styles.sessionLabel}>Completed</Text>
            <Text style={styles.sessionValue}>
              {paymentInfo.session_info.completed_sessions}
            </Text>
          </View>
          <View style={styles.sessionItem}>
            <Text style={styles.sessionLabel}>Remaining</Text>
            <Text style={styles.sessionValue}>
              {paymentInfo.session_info.remaining_sessions}
            </Text>
          </View>
          <View style={styles.sessionItem}>
            <Text style={styles.sessionLabel}>Per Session</Text>
            <Text style={styles.sessionValue}>
              {formatCurrency(paymentInfo.session_info.per_session_amount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Payment Structure */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Structure</Text>
        <View style={styles.paymentTypeContainer}>
          <Text style={styles.paymentTypeLabel}>Payment Type:</Text>
          <View style={styles.paymentTypeBadge}>
            <Text style={styles.paymentTypeText}>
              {paymentInfo.payment_structure.payment_type}
            </Text>
          </View>
        </View>
        {paymentInfo.payment_structure.next_payment_due && (
          <View style={styles.nextPaymentContainer}>
            <Text style={styles.nextPaymentLabel}>Next Payment Due:</Text>
            <Text style={styles.nextPaymentDate}>
              {formatDate(paymentInfo.payment_structure.next_payment_due)}
            </Text>
          </View>
        )}
      </View>

      {/* Payment History */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {paymentInfo.payment_history.map((payment, index) => (
          <View key={index} style={styles.paymentHistoryItem}>
            <View style={styles.paymentHistoryLeft}>
              <Text style={styles.paymentHistorySession}>
                Session {payment.session_number}
              </Text>
              <Text style={styles.paymentHistoryDate}>
                {formatDate(payment.date)}
              </Text>
            </View>
            <View style={styles.paymentHistoryRight}>
              <Text style={styles.paymentHistoryAmount}>
                {formatCurrency(payment.amount)}
              </Text>
              <Text style={styles.paymentHistoryType}>{payment.type}</Text>
            </View>
          </View>
        ))}
      </View>
      {paymentInfo.payment_structure.payment_type !== "one-time" && (
        <TouchableOpacity
          style={styles.recordPaymentButton}
          onPress={() => setIsPaymentModalVisible(true)}
        >
          <Text style={styles.buttonText}>Record Payment</Text>
        </TouchableOpacity>
      )}
      <PaymentModal
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
        onSubmit={handleRecordPayment}
        currentSession={paymentInfo.session_info.completed_sessions}
      />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setIsCloseModalVisible(true)}
      >
        <Text style={styles.buttonText}>Close</Text>
        <Modal
          visible={isCloseModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsCloseModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>What would you like to do?</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setIsCloseModalVisible(false);
                  navigation.navigate("DoctorDashboard"); // Replace with your dashboard route
                }}
              >
                <Text style={styles.buttonText}>Go to Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setIsCloseModalVisible(false);
                  navigation.navigate("CreateTherapy", {
                    patientId: patientId,
                  }); // Replace with your appointment route
                }}
              >
                <Text style={styles.buttonText}>Set up an Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.AcancelButton}
                onPress={() => setIsCloseModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    addonContainer: {
      flexDirection: "row",
      marginBottom: 16,
      alignItems: "center",
    },
    addonInput: {
      flex: 2,
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 8,
      padding: 12,
      marginRight: 8,
      fontSize: 16,
    },
    addonAmountInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 8,
      padding: 12,
      marginRight: 8,
      fontSize: 16,
    },
    addAddonButton: {
      backgroundColor: "#119FB3",
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    addAddonButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    addonListItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    addonListItemText: {
      fontSize: 16,
      color: "#2c3e50",
    },
    removeAddonButton: {
      backgroundColor: "#e74c3c",
      borderRadius: 16,
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    removeAddonButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "bold",
    },

    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    AcancelButton: {
      backgroundColor: "#6c757d",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 8,
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 20,
      width: "90%",
      maxWidth: 400,
    },
    actionButton: {
      backgroundColor: "#119FB3",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 8,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 16,
      color: "#6c757d",
      marginBottom: 16,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ced4da",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
    },
    paymentTypeSelector: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: "#f8f9fa",
      marginHorizontal: 4,
      alignItems: "center",
    },
    selectedTypeButton: {
      backgroundColor: "#119FB3",
    },
    typeButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: "#2c3e50",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cancelButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: "#6c757d",
      marginRight: 8,
      alignItems: "center",
    },
    submitButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: "#119FB3",
      marginLeft: 8,
      alignItems: "center",
    },
    recordPaymentButton: {
      backgroundColor: "#119FB3",
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 16,
    },
    container: {
      flex: 1,
      backgroundColor: "white",
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    errorText: {
      fontSize: 16,
      color: "#e74c3c",
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: "#119FB3",
      padding: 12,
      borderRadius: 8,
      minWidth: 120,
      alignItems: "center",
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 20,
      textAlign: "center",
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 16,
    },
    rowContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    amountBox: {
      flex: 1,
      padding: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      marginHorizontal: 4,
      alignItems: "center",
    },
    amountLabel: {
      fontSize: 14,
      color: "#6c757d",
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#2c3e50",
    },
    addonsContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    addonsLabel: {
      fontSize: 14,
      color: "#6c757d",
    },
    addonsValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#119FB3",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 12,
    },
    sessionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    sessionItem: {
      width: "48%",
      backgroundColor: "#f8f9fa",
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    sessionLabel: {
      fontSize: 14,
      color: "#6c757d",
      marginBottom: 4,
    },
    sessionValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#2c3e50",
    },
    paymentTypeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    paymentTypeLabel: {
      fontSize: 16,
      color: "#6c757d",
      marginRight: 8,
    },
    paymentTypeBadge: {
      backgroundColor: "#119FB3",
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    paymentTypeText: {
      color: "white",
      fontSize: 14,
      fontWeight: "500",
    },
    nextPaymentContainer: {
      marginTop: 8,
    },
    nextPaymentLabel: {
      fontSize: 16,
      color: "#6c757d",
      marginBottom: 4,
    },
    nextPaymentDate: {
      fontSize: 16,
      fontWeight: "500",
      color: "#2c3e50",
    },
    paymentHistoryItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    paymentHistoryLeft: {
      flex: 1,
    },
    paymentHistoryRight: {
      alignItems: "flex-end",
    },
    paymentHistorySession: {
      fontSize: 16,
      fontWeight: "500",
      color: "#2c3e50",
    },
    paymentHistoryDate: {
      fontSize: 14,
      color: "#6c757d",
      marginTop: 2,
    },
    paymentHistoryAmount: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#119FB3",
    },
    paymentHistoryType: {
      fontSize: 12,
      color: "#6c757d",
      marginTop: 2,
    },
    closeButton: {
      backgroundColor: "#119FB3",
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginVertical: 16,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
  });

export default PaymentDetailsScreen;
