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
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useSession } from "../context/SessionContext";

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
    received_amount: "",
    therapy_name: "",
    balance: "",
  });
  const { patientId } = route.params;
  const { session, refreshAllTokens } = useSession();

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [error, setError] = useState("");

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
      setTherapyPlan({ ...therapyPlan, therapy_duration: `${diffDays} days` });
    }
  }, [startDate, endDate]);

  const onChangeStartDate = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

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

  const handleCreateTherapyPlan = async () => {
    setIsLoading(true);
    setError("");

    try {
      setIsLoading(true);
      await refreshAllTokens();
      const requestBody = {
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
      };

      const response = await axios.post(
        `https://healtrackapp-production.up.railway.app/therapy/plan/${patientId}`,
        requestBody,
        {
          headers: { Authorization: `Bearer ${session.tokens.idToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Therapy plan created successfully");
        navigation.goBack();
      } else {
        setError("Failed to create therapy plan. Please try again.");
      }
    } catch (error) {
      setError("An error occurred while creating therapy plan.");
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
    <ScrollView style={styles.scrollView}>
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
        <Dropdown
          value={therapyPlan.therapy_category}
          onValueChange={(itemValue) =>
            setTherapyPlan({ ...therapyPlan, therapy_category: itemValue })
          }
          items={categories}
        />
        <InputField
          icon={<MaterialIcons name="edit" size={24} color="#119FB3" />}
          placeholder="Therapy Name"
          value={therapyPlan.therapy_name}
          onChangeText={(text) =>
            setTherapyPlan({ ...therapyPlan, therapy_name: text })
          }
        />
        <InputField
          icon={<MaterialIcons name="healing" size={24} color="#119FB3" />}
          placeholder="Patient Symptoms"
          value={therapyPlan.patient_symptoms}
          onChangeText={(text) =>
            setTherapyPlan({ ...therapyPlan, patient_symptoms: text })
          }
        />
        <InputField
          icon={
            <MaterialIcons name="local-hospital" size={24} color="#119FB3" />
          }
          placeholder="Patient Diagnosis"
          value={therapyPlan.patient_diagnosis}
          onChangeText={(text) =>
            setTherapyPlan({ ...therapyPlan, patient_diagnosis: text })
          }
        />

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

        <View style={styles.durationContainer}>
          <MaterialIcons name="timer" size={24} color="#119FB3" />
          <Text style={styles.durationValue}>
            Duration: {therapyPlan.therapy_duration}
          </Text>
        </View>
        <View style={styles.labeledInputContainer}>
          <Text style={styles.inputLabel}>Total Amount</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="rupee" size={24} color="#119FB3" />
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

        <View style={styles.labeledInputContainer}>
          <Text style={styles.inputLabel}>Received Amount</Text>
          <View style={styles.inputContainer}>
            <FontAwesome name="rupee" size={24} color="#119FB3" />
            <TextInput
              style={styles.input}
              placeholder="Enter received amount"
              value={therapyPlan.received_amount}
              onChangeText={(text) =>
                setTherapyPlan({ ...therapyPlan, received_amount: text })
              }
              keyboardType="numeric"
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>
        <View style={styles.balanceContainer}>
          <MaterialIcons name="account-balance" size={24} color="#119FB3" />
          <Text style={styles.balanceValue}>
            Balance: {therapyPlan.balance} Rs
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
      <FontAwesome name="calendar" size={24} color="#119FB3" />
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
    <MaterialIcons name="category" size={24} color="#119FB3" />
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
  scrollView: {
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#F0F8FF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#119FB3",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 25,
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
    color: "#119FB3",
    marginBottom: 5,
  },
  dateTimeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#119FB3",
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
    backgroundColor: "#119FB3",
    paddingVertical: 12,
    borderRadius: 10,
    width: "50%",
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
});

export default CreateTherapyPlan;
