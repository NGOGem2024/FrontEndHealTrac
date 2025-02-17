import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  KeyboardTypeOptions,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BackTabTop from "./BackTopTab";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleError, showSuccessToast } from "../utils/errorHandler";
import axiosInstance from "../utils/axiosConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type UpdatePatientProps = {
  navigation: StackNavigationProp<RootStackParamList, "UpdatePatient">;
  route: { params: { patientId: string } };
};

const UpdatePatient: React.FC<UpdatePatientProps> = ({ navigation, route }) => {
  const { patientId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  });
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

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [duration, setDuration] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  const validateEmail = (email: string): boolean => {
    if (!email) return true; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    setErrors((prev) => ({
      ...prev,
      email: isValid ? "" : "Please enter a valid email address",
    }));
    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    const isValid = indianPhoneRegex.test(cleanPhone);
    
    setErrors((prev) => ({
      ...prev,
      phone: isValid
        ? ""
        : "Please enter a valid phone number start with 6-9",
    }));
    
    return isValid;
  };
  
  const handleTextChange = (field: string, inputText: string) => {
    if (field === "patient_first_name" || field === "patient_last_name") {
      setPatientData({ ...patientData, [field]: inputText });
    } else {
      setPatientData({ ...patientData, [field]: inputText });
    }
  };

  const handleEmailChange = (value: string) => {
    const lowerCaseValue = value.toLowerCase();
    setPatientData({ ...patientData, patient_email: lowerCaseValue });
    if (value) {
      validateEmail(lowerCaseValue);
    } else {
      setErrors(prev => ({ ...prev, email: "" })); 
    }
  };

  const handlePhoneChange = (value: string) => {
    let formattedValue = value;
    if (!value.startsWith('+91')) {
      formattedValue = '+91 ' + value.replace(/[^\d]/g, '');
    }
    const maxLength = 14; 
    const truncatedValue = formattedValue.slice(0, maxLength);
    const cleanValue = truncatedValue.replace(/[^\d+]/g, '');

    const finalValue = cleanValue.length > 3 
      ? `${cleanValue.slice(0, 3)} ${cleanValue.slice(3)}` 
      : cleanValue;
  
    setPatientData({ ...patientData, patient_phone: finalValue });
    validatePhone(finalValue);
  };
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        scrollViewRef.current?.scrollToPosition(0, 100, true); 
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    fetchPatientData();
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/patient/${patientId}`);
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
      setDuration(patientInfo.therepy_duration || "");

      if (patientInfo.therepy_start) {
        setStartDate(parseDateString(patientInfo.therepy_start));
      }
      if (patientInfo.therepy_end) {
        setEndDate(parseDateString(patientInfo.therepy_end));
      }
    } catch (error) {
      handleError(error);
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

  const handlePatientUpdate = async () => {
    Keyboard.dismiss();
    const isEmailValid = validateEmail(patientData.patient_email);
    const isPhoneValid = validatePhone(patientData.patient_phone);

    if (!isEmailValid || !isPhoneValid) {
      handleError("Please correct the validation errors before submitting.");
      return;
    }

    setIsLoading(true);

    try {
      const liveSwitchToken = await AsyncStorage.getItem("liveSwitchToken");
      const formattedStartDate = startDate ? formatDate(startDate) : "";
      const formattedEndDate = endDate ? formatDate(endDate) : "";

      const submissionData = {
        ...patientData,
        therepy_start: formattedStartDate,
        therepy_end: formattedEndDate,
        therepy_duration: duration,
      };

      if (!submissionData.patient_email) {
        delete submissionData.patient_email;
      }

      const response = await axiosInstance.post(
        `/patient/update/${patientId}`,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      showSuccessToast("Patient updated successfully");
      navigation.navigate("AllPatients");
    } catch (error) {
      handleError(error);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.mainContainer}>
          <BackTabTop screenName="Patient" />
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollViewContent}
            style={styles.scrollView}
          >
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Update Patient</Text>
            <InputField
              icon={<Ionicons name="person" size={24} color='#007B8E' />}
              placeholder="First Name"
              value={patientData.patient_first_name}
              onChangeText={(text) =>
                handleTextChange("patient_first_name", text)
              }
            />
            <InputField
              icon={<Ionicons name="person" size={24} color='#007B8E' />}
              placeholder="Last Name"
              value={patientData.patient_last_name}
              onChangeText={(text) =>
                handleTextChange("patient_last_name", text)
              }
            />
            <View>
              <InputField
                icon={<MaterialIcons name="email" size={24} color='#007B8E' />}
                placeholder="Email"
                value={patientData.patient_email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View>
              <InputField
                icon={<Ionicons name="call" size={24} color='#007B8E' />}
                placeholder="Contact No"
                value={patientData.patient_phone}
                onChangeText={handlePhoneChange}
              />
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>
            <InputField
              icon={<Ionicons name="location" size={24} color='#007B8E'/>}
              placeholder="Address 1"
              value={patientData.patient_address1}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_address1: text })
              }
            />
            <InputField
              icon={<Ionicons name="location" size={24} color='#007B8E' />}
              placeholder="Address 2"
              value={patientData.patient_address2}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_address2: text })
              }
            />
            <InputField
              icon={<MaterialIcons name="numbers" size={24} color='#007B8E' />}
              placeholder="Age"
              value={patientData.patient_age}
              onChangeText={(text) =>
                setPatientData({ ...patientData, patient_age: text })
              }
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                isKeyboardVisible && styles.saveButtonKeyboardVisible,
              ]}
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
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#F0F8FF",
  },
  scrollView: {
    backgroundColor: "#F0F8FF",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F0F8FF",
  },
  errorText: {
    color: "#FF0000",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: '#007B8E',
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
    borderColor: '#007B8E',
    backgroundColor: "#E6F7FB",
  },
  genderButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333333",
  },
  genderButtonTextSelected: {
    color: '#007B8E',
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
    color: '#007B8E',
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  saveButton: {
    backgroundColor: '#007B8E',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonKeyboardVisible: {
    marginBottom: 100, // Ensures button is above keyboard
  },
});

export default UpdatePatient;
