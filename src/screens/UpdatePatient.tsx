import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardTypeOptions,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import axios from "axios";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import BackTabTop from "./BackTopTab";
import { Picker } from "@react-native-picker/picker";
import { useSession } from "../context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UpdatePatientProps = {
  navigation: StackNavigationProp<RootStackParamList, "UpdatePatient">;
  route: { params: { patientId: string } };
};

const UpdatePatient: React.FC<UpdatePatientProps> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const { session, refreshAllTokens } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    patient_gender: "",
    patient_address1: "",
    patient_address2: "",
    patient_age: "",
    patient_bloodGroup: "",
    patient_symptoms: "",
    therepy_category: "",
    patient_diagnosis: "",
    patient_therapy_type: "",
    therapy_duration: "",
    patient_id: "",
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [duration, setDuration] = useState("");

  const [fadeAnim] = useState(new Animated.Value(0));

  const handleTextChange = (field: string, inputText: string) => {
    if (field === "patient_first_name" || field === "patient_last_name") {
      // Allow any text input for first name and last name
      setPatientData({ ...patientData, [field]: inputText });
    } else {
      // For all other fields, including patient_symptoms, update normally
      setPatientData({ ...patientData, [field]: inputText });
    }
  };
  const handleEmailChange = (value: string) => {
    const lowerCaseValue = value.toLowerCase(); // Convert to lowercase
    setPatientData({ ...patientData, patient_email: lowerCaseValue });
  };

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
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    fetchPatientData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDuration(`${diffDays} days`);
    }
  }, [startDate, endDate]);

  const fetchPatientData = async () => {
    setIsLoading(true);
    await refreshAllTokens();
    try {
      const response = await axios.get(
        `https://healtrackapp-production.up.railway.app/patient/${patientId}`,
        {
          headers: {
            Authorization: "Bearer " + session.tokens.idToken,
          },
        }
      );
      const patientInfo = response.data.patientData;
      setPatientData({
        ...patientData,
        patient_first_name: patientInfo.patient_first_name || "",
        patient_last_name: patientInfo.patient_last_name || "",
        patient_email: patientInfo.patient_email || "",
        patient_phone: patientInfo.patient_phone || "",
        patient_address1: patientInfo.patient_address1 || "",
        patient_address2: patientInfo.patient_address2 || "",
        patient_age: patientInfo.patient_age || "",
        patient_symptoms: patientInfo.patient_symptoms || "",
        patient_diagnosis: patientInfo.patient_diagnosis || "",
        patient_id: patientInfo.patient_id,
      });
      setSelectedCategory(patientInfo.patient_therepy_category || "");
      setDuration(patientInfo.therepy_duration || "");

      // Handle potentially empty date values
      if (patientInfo.therepy_start) {
        setStartDate(parseDateString(patientInfo.therepy_start));
      }
      if (patientInfo.therepy_end) {
        setEndDate(parseDateString(patientInfo.therepy_end));
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      Alert.alert("Error", "Failed to fetch patient data");
    } finally {
      setIsLoading(false);
    }
  };

  const parseDateString = (dateString: string): Date | null => {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return null;
  };

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

  const handlePatientUpdate = async () => {
    setIsLoading(true);

    try {
      const liveSwitchToken = await AsyncStorage.getItem("liveSwitchToken");
      const formattedStartDate = startDate ? formatDate(startDate) : "";
      const formattedEndDate = endDate ? formatDate(endDate) : "";
      await refreshAllTokens();
      const response = await axios.post(
        `https://healtrackapp-production.up.railway.app/patient/update/${patientData.patient_id}`,
        {
          ...patientData,
          therepy_start: formattedStartDate,
          therepy_end: formattedEndDate,
          therepy_duration: duration,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.tokens.idToken,
            "x-liveswitch-token": liveSwitchToken,
          },
        }
      );
      Alert.alert("Success", "Patient updated successfully");
      navigation.navigate("AllPatients");
    } catch (error) {
      console.error("Error updating patient:", error);
      Alert.alert("Error", "Failed to update patient");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-GB"); // This will format as DD/MM/YYYY
  };

  return (
    <>
      <BackTabTop />
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Update Patient</Text>
          <InputField
            icon={<Ionicons name="person" size={24} color="#119FB3" />}
            placeholder="First Name"
            value={patientData.patient_first_name}
            onChangeText={(text) =>
              handleTextChange("patient_first_name", text)
            }
          />
          <InputField
            icon={<Ionicons name="person" size={24} color="#119FB3" />}
            placeholder="Last Name"
            value={patientData.patient_last_name}
            onChangeText={(text) => handleTextChange("patient_last_name", text)}
          />
          <InputField
            icon={<MaterialIcons name="email" size={24} color="#119FB3" />}
            placeholder="Email"
            value={patientData.patient_email}
            onChangeText={handleEmailChange}
          />
          <InputField
            icon={<Ionicons name="call" size={24} color="#119FB3" />}
            placeholder="Contact No"
            value={patientData.patient_phone}
            onChangeText={(text) =>
              setPatientData({ ...patientData, patient_phone: text })
            }
          />
          <InputField
            icon={<Ionicons name="location" size={24} color="#119FB3" />}
            placeholder="Address 1"
            value={patientData.patient_address1}
            onChangeText={(text) =>
              setPatientData({ ...patientData, patient_address1: text })
            }
          />
          <InputField
            icon={<Ionicons name="location" size={24} color="#119FB3" />}
            placeholder="Address 2"
            value={patientData.patient_address2}
            onChangeText={(text) =>
              setPatientData({ ...patientData, patient_address2: text })
            }
          />
          <InputField
            icon={<MaterialIcons name="numbers" size={24} color="#119FB3" />}
            placeholder="Age"
            value={patientData.patient_age}
            onChangeText={(text) =>
              setPatientData({ ...patientData, patient_age: text })
            }
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handlePatientUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </>
  );
};

const InputField = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default" as KeyboardTypeOptions,
  editable = true,
}) => (
  <View style={styles.inputContainer}>
    {icon}
    <TextInput
      style={[styles.input, !editable && styles.disabledInput]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#A0A0A0"
      editable={editable}
    />
  </View>
);

const DatePickerField = ({
  label,
  date,
  showDatePicker,
  onPress,
  onChange,
  formatDate,
}) => (
  <View style={styles.dateBlock}>
    <Text style={styles.dateLabel}>{label}</Text>
    <TouchableOpacity style={styles.dateContainer} onPress={onPress}>
      <Text style={styles.dateText}>
        {date ? formatDate(date) : "Select date"}
      </Text>
      <FontAwesome name="calendar" size={24} color="#119FB3" />
    </TouchableOpacity>
    {showDatePicker && (
      <DateTimePicker
        value={date || new Date()}
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
    padding: 20,
    backgroundColor: "#F0F8FF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#119FB3",
    textAlign: "center",
    marginBottom: 20,
  },
  disabledInput: {
    backgroundColor: "#F0F0F0",
    color: "#888888",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#333333",
    fontSize: 16,
    paddingVertical: 12,
  },
  genderContainer: {
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#A0A0A0",
    marginBottom: 10,
  },
  genderButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  genderButtonSelected: {
    borderColor: "#119FB3",
    backgroundColor: "#E6F7FB",
  },
  genderButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333333",
  },
  genderButtonTextSelected: {
    color: "#119FB3",
    fontWeight: "bold",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateBlock: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 5,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: "#333333",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  durationValue: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333333",
  },
  saveButton: {
    backgroundColor: "#119FB3",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
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
});

export default UpdatePatient;
