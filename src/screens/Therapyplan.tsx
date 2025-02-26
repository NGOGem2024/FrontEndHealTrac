import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useSession } from "../context/SessionContext";
import { handleError, showSuccessToast } from "../utils/errorHandler";
import axiosInstance from "../utils/axiosConfig";
import BackTabTop from "./BackTopTab";
import TherapyCategoryDropdown from "../screens/TherapyCategoryDropdown";

type CreateTherapyPlanProps = {
  navigation: StackNavigationProp<RootStackParamList, "CreateTherapyPlan">;
  route: { params: { patientId: string } };
};

const CreateTherapyPlan: React.FC<CreateTherapyPlanProps> = ({
  navigation,
  route,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [therapyPlan, setTherapyPlan] = useState({
    patient_diagnosis: "",
    patient_symptoms: "",
    therapy_duration: "",
    therapy_category: "",
    total_amount: "",
    received_amount: "0",
    therapy_name: "",
    balance: "",
    payment_type: "recurring",
    per_session_amount: "",
    estimated_sessions: "",
  });
  const { patientId } = route.params;
  const { session } = useSession();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  const categories = [
    "Musculoskeletal",
    "Neurological",
    "Cardiorespiratory",
    "Paediatrics",
    "Women's Health",
    "Geriatrics",
    "Post surgical rehabilitation",
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      // Estimate 2 sessions per week
      const estimatedSessions = Math.ceil((diffDays / 7) * 2);
      setTherapyPlan((prev) => ({
        ...prev,
        therapy_duration: `${diffDays} days`,
        estimated_sessions: estimatedSessions.toString(),
      }));
    }
  }, [startDate, endDate]);

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  useEffect(() => {
    if (
      therapyPlan.payment_type === "recurring" &&
      therapyPlan.estimated_sessions &&
      therapyPlan.total_amount
    ) {
      const perSession = (
        parseFloat(therapyPlan.total_amount) /
        parseFloat(therapyPlan.estimated_sessions)
      ).toFixed(2);
      setTherapyPlan((prev) => ({
        ...prev,
        per_session_amount: perSession,
      }));
    }
  }, [
    therapyPlan.total_amount,
    therapyPlan.estimated_sessions,
    therapyPlan.payment_type,
  ]);

  const onChangeEndDate = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const showStartDatepicker = () => {
    setShowStartDatePicker(true);
  };

  const showEndDatepicker = () => {
    setShowEndDatePicker(true);
  };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};

    if (!therapyPlan.therapy_name.trim()) {
      newErrors.therapy_name = "Therapy name is required";
    }
    if (!session.is_admin) {
      // Only validate these fields if the user is not an admin
      if (!therapyPlan.patient_symptoms.trim()) {
        newErrors.patient_symptoms = "Patient symptoms are required";
      }
      if (!therapyPlan.patient_diagnosis.trim()) {
        newErrors.patient_diagnosis = "Patient diagnosis is required";
      }
    }
    if (!therapyPlan.therapy_category) {
      newErrors.therapy_category = "Therapy category is required";
    }
    if (!therapyPlan.total_amount.trim()) {
      newErrors.total_amount = "Total amount is required";
    } else if (isNaN(parseFloat(therapyPlan.total_amount))) {
      newErrors.total_amount = "Total amount must be a valid number";
    }
    if (!therapyPlan.received_amount.trim()) {
      newErrors.received_amount = "Received amount is required";
    } else if (isNaN(parseFloat(therapyPlan.received_amount))) {
      newErrors.received_amount = "Received amount must be a valid number";
    }
    if (therapyPlan.payment_type === "recurring") {
      if (
        !therapyPlan.per_session_amount ||
        parseFloat(therapyPlan.per_session_amount) <= 0
      ) {
        newErrors.per_session_amount = "Per session amount is required";
      }
      if (
        !therapyPlan.estimated_sessions ||
        parseInt(therapyPlan.estimated_sessions) <= 0
      ) {
        newErrors.estimated_sessions = "Estimated sessions is required";
      }
    }

    if (
      therapyPlan.payment_type === "one-time" &&
      parseFloat(therapyPlan.received_amount) !==
        parseFloat(therapyPlan.total_amount)
    ) {
      newErrors.received_amount = "One-time payment requires full amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const paymentTypes = [
    { label: "Recurring Payment", value: "recurring" },
    { label: "One-time Payment", value: "one-time" },
  ];

  const handleReceivedAmountChange = (text: string) => {
    let cleanedValue = text.replace(/^0+/, '');
    
    if (!cleanedValue) {
      cleanedValue = "0";
    }
    if (cleanedValue.startsWith('.')) {
      cleanedValue = '0' + cleanedValue;
    }
    
    setTherapyPlan(prev => ({
      ...prev,
      received_amount: cleanedValue
    }));
  };


  const handleCreateTherapyPlan = async () => {
    if (!validateForm()) {
      Alert.alert(
        "Validation Error",
        "Please fill in all required fields correctly."
      );
      return;
    }

    setIsLoading(true);

    try {
      const formData = {
        therapy_name: therapyPlan.therapy_name,
        patient_diagnosis: therapyPlan.patient_diagnosis,
        patient_symptoms: therapyPlan.patient_symptoms,
        therapy_duration: therapyPlan.therapy_duration,
        therapy_start: startDate.toISOString().split("T")[0],
        therapy_end: endDate.toISOString().split("T")[0],
        patient_therapy_category: therapyPlan.therapy_category,
        total_amount: therapyPlan.total_amount,
        received_amount: therapyPlan.received_amount,
        balance: therapyPlan.balance,
        payment_type: therapyPlan.payment_type,
        estimated_sessions: parseInt(therapyPlan.estimated_sessions),
        per_session_amount: parseFloat(therapyPlan.per_session_amount),
      };

      const response = await axiosInstance.post(
        `/therapy/plan/${patientId}`,
        formData
      );

      if (response.status === 200 || response.status === 201) {
        showSuccessToast("Therapy plan created successfully");
        navigation.goBack();
      } else {
        setErrors({
          ...errors,
          submit: "Failed to create therapy plan. Please try again.",
        });
      }
    } catch (error) {
      handleError(error);
      setErrors({
        ...errors,
        submit: "An error occurred while creating therapy plan.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const total = parseFloat(therapyPlan.total_amount) || 0;
    const received = parseFloat(therapyPlan.received_amount) || 0;
    const balance = total - received;
    setTherapyPlan({ ...therapyPlan, balance: balance.toString() });
  }, [therapyPlan.total_amount, therapyPlan.received_amount]);
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Plan" />
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Create Therapy Plan</Text>
          <TherapyCategoryDropdown
            value={therapyPlan.therapy_category}
            onValueChange={(itemValue) =>
              setTherapyPlan({ ...therapyPlan, therapy_category: itemValue })
            }
            items={categories}
          />
          {errors.therapy_category && (
            <Text style={styles.errorText}>{errors.therapy_category}</Text>
          )}
          <InputField
            icon={<MaterialIcons name="edit" size={24} color='#007B8E' />}
            placeholder="Therapy Name"
            value={therapyPlan.therapy_name}
            onChangeText={(text) =>
              setTherapyPlan({ ...therapyPlan, therapy_name: text })
            }
          />
          {errors.therapy_name && (
            <Text style={styles.errorText}>{errors.therapy_name}</Text>
          )}
          <InputField
            icon={<MaterialIcons name="healing" size={24} color='#007B8E' />}
            placeholder="Patient Symptoms"
            value={therapyPlan.patient_symptoms}
            onChangeText={(text) =>
              setTherapyPlan({ ...therapyPlan, patient_symptoms: text })
            }
          />
          {errors.patient_symptoms && (
            <Text style={styles.errorText}>{errors.patient_symptoms}</Text>
          )}
          <InputField
            icon={
              <MaterialIcons name="local-hospital" size={24} color='#007B8E' />
            }
            placeholder="Patient Diagnosis"
            value={therapyPlan.patient_diagnosis}
            onChangeText={(text) =>
              setTherapyPlan({ ...therapyPlan, patient_diagnosis: text })
            }
          />
          {errors.patient_diagnosis && (
            <Text style={styles.errorText}>{errors.patient_diagnosis}</Text>
          )}

          <View style={styles.dateTimeRow}>
            <DatePickerField
              label="Start Date"
              date={startDate}
              showDatePicker={showStartDatePicker}
              onPress={showStartDatepicker}
              onChange={onChangeStartDate}
            />

            <DatePickerField
              label="End Date"
              date={endDate}
              showDatePicker={showEndDatePicker}
              onPress={showEndDatepicker}
              onChange={onChangeEndDate}
            />
          </View>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          <View style={styles.durationContainer}>
            <MaterialIcons name="timer" size={24} color='#007B8E'/>
            <Text style={styles.durationValue}>
              Duration: {therapyPlan.therapy_duration}
            </Text>
          </View>
          <View style={styles.paymentTypeContainer}>
            <Text style={styles.inputLabel}>Payment Type</Text>
            <View style={styles.radioGroup}>
              {paymentTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.radioButton,
                    therapyPlan.payment_type === type.value &&
                      styles.radioButtonSelected,
                  ]}
                  onPress={() =>
                    setTherapyPlan({ ...therapyPlan, payment_type: type.value })
                  }
                >
                  <View style={styles.radio}>
                    {therapyPlan.payment_type === type.value && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Estimated Sessions</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="event-repeat" size={24} color='#007B8E' />
              <TextInput
                style={styles.input}
                placeholder="Enter estimated sessions"
                value={therapyPlan.estimated_sessions}
                onChangeText={(text) => {
                  setTherapyPlan((prev) => ({
                    ...prev,
                    estimated_sessions: text,
                    total_amount:
                      text && prev.per_session_amount
                        ? (
                            parseFloat(text) *
                            parseFloat(prev.per_session_amount)
                          ).toFixed(2)
                        : prev.total_amount,
                  }));
                }}
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          {therapyPlan.payment_type === "recurring" && (
            <>
              <View style={styles.labeledInputContainer}>
                <Text style={styles.inputLabel}>Amount Per Session</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="rupee" size={24} color='#007B8E' />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount per session"
                    value={therapyPlan.per_session_amount}
                    onChangeText={(text) => {
                      setTherapyPlan((prev) => ({
                        ...prev,
                        per_session_amount: text,
                        total_amount:
                          text && prev.estimated_sessions
                            ? (
                                parseFloat(text) *
                                parseFloat(prev.estimated_sessions)
                              ).toFixed(2)
                            : prev.total_amount,
                      }));
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                {errors.per_session_amount && (
                  <Text style={styles.errorText}>
                    {errors.per_session_amount}
                  </Text>
                )}
              </View>
            </>
          )}

          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Total Amount</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="rupee" size={24} color='#007B8E' />
              <TextInput
                style={styles.input}
                placeholder="Enter total amount"
                value={therapyPlan.total_amount}
                onChangeText={(text) =>
                  setTherapyPlan({ ...therapyPlan, total_amount: text })
                }
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
          {errors.total_amount && (
            <Text style={styles.errorText}>{errors.total_amount}</Text>
          )}

          <View style={styles.labeledInputContainer}>
            <Text style={styles.inputLabel}>Received Amount</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="rupee" size={24} color='#007B8E' />
              <TextInput
                style={styles.input}
                placeholder="Enter received amount"
                value={therapyPlan.received_amount}
                onChangeText={handleReceivedAmountChange}
                keyboardType="numeric"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>
          {errors.received_amount && (
            <Text style={styles.errorText}>{errors.received_amount}</Text>
          )}
          <View style={styles.balanceContainer}>
            <MaterialIcons name="account-balance" size={24} color='#007B8E'/>
            <Text style={styles.balanceValue}>
              Balance: {therapyPlan.balance} Rs
            </Text>
          </View>

          {errors.submit && (
            <Text style={styles.errorText}>{errors.submit}</Text>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleCreateTherapyPlan}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Create Plan</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InputField = ({ icon, placeholder, value, onChangeText }) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#A0A0A0"
    />
  </View>
);

const DatePickerField = ({
  label,
  date,
  showDatePicker,
  onPress,
  onChange,
}) => (
  <View style={styles.dateTimeBlock}>
    <Text style={styles.dateTimeLabel}>{label}</Text>
    <TouchableOpacity style={styles.dateTimeContainer} onPress={onPress}>
      <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
      <FontAwesome name="calendar" size={24} color='#007B8E' />
    </TouchableOpacity>
    {showDatePicker && (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={onChange}
      />
    )}
  </View>
);

const Dropdown = ({ value, onValueChange, items }) => (
  <View style={styles.inputContainer}>
    <MaterialIcons name="category" size={24} color='#007B8E' />
    <Picker
      selectedValue={value}
      onValueChange={onValueChange}
      style={styles.picker}
    >
      <Picker.Item label="Therapy Category" value="" />
      {items.map((item, index) => (
        <Picker.Item key={index} label={item} value={item} />
      ))}
    </Picker>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
    paddingHorizontal: "5%",
    paddingVertical: 30,
    backgroundColor: "#F0F8FF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: '#007B8E',
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  labeledInputContainer: {
    marginBottom: 0,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  balanceValue: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333333",
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#333333",
    fontSize: 16,
    paddingVertical: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateTimeBlock: {
    flex: 1,
    marginHorizontal: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#007B8E',
    marginBottom: 5,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#007B8E',
    marginBottom: 5,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#333333",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  durationValue: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333333",
  },
  saveButton: {
    backgroundColor: '#007B8E',
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    flex: 1,
    marginLeft: 10,
    color: "#333333",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  paymentTypeContainer: {
    marginBottom: 20,
    width: "100%",
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    flex: 0.48,
    elevation: 2,
  },
  radioButtonSelected: {
    backgroundColor: "#E6F7F9",
    borderColor: '#007B8E',
    borderWidth: 1,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007B8E',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#007B8E',
  },
  radioLabel: {
    fontSize: 12,
    color: "#333333",
  },
  sessionInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F7F9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sessionInfoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333333",
    lineHeight: 24,
  },
});

export default CreateTherapyPlan;
