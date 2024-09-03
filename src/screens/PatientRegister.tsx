import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  KeyboardType,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import axios from "axios";
import * as Animatable from "react-native-animatable";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

type PatientRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "PatientRegister">;
};

const initialPatientData = {
  patient_first_name: "",
  patient_last_name: "",
  patient_email: "",
  patient_phone: "",
  referral_source: "",
  referral_details: "",
};
const PatientRegister: React.FC<PatientRegisterScreenProps> = ({
  navigation,
}) => {
  const { session, refreshAllTokens } = useSession();
  const [patientData, setPatientData] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    referral_source: "",
    referral_details: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;
    if (field === "patient_first_name" || field === "patient_last_name") {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (field === "patient_phone") {
      newValue = value.replace(/[^0-9]/g, "");
    } else if (field === "patient_email") {
      newValue = value.toLowerCase();
    }
    setPatientData({ ...patientData, [field]: newValue });
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePatientRegister = async () => {
    if (!patientData.patient_first_name || !patientData.patient_last_name) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    if (patientData.patient_phone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    if (!patientData.referral_source) {
      Alert.alert("Error", "Please select a referral source");
      return;
    }

    if (
      patientData.referral_source !== "Social Media" &&
      !patientData.referral_details
    ) {
      Alert.alert("Error", "Please enter referral details");
      return;
    }

    setIsLoading(true);
    try {
      await refreshAllTokens();
      const liveSwitchToken = await AsyncStorage.getItem("liveSwitchToken");
      if (!liveSwitchToken) {
        throw new Error("LiveSwitch token not available");
      }
      const formattedData = {
        ...patientData,
        patient_phone: "+91" + patientData.patient_phone,
      };

      const response = await axios.post(
        "https://healtrackapp-production.up.railway.app/patient/registration",
        formattedData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + session.tokens.idToken,
            "X-LiveSwitch-Token": liveSwitchToken,
          },
        }
      );
      Alert.alert("Success", "Patient registered successfully");
      setPatientData(initialPatientData);
      navigation.navigate("UpdatePatient", {
        patientId: response.data.patient._id,
      });
    } catch (error) {
      console.error("Error registering patient:", error);
      Alert.alert("Error", "Failed to register patient");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    placeholder: string,
    value: string,
    field: string,
    keyboardType: KeyboardType = "default"
  ) => (
    <Animatable.View animation="fadeInUp" style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={(text) => handleInputChange(field, text)}
        keyboardType={keyboardType}
        autoCapitalize={field === "patient_email" ? "none" : "sentences"}
      />
    </Animatable.View>
  );

  return (
    <ImageBackground
      source={require("../assets/bac2.jpg")}
      style={styles.backgroundImage}
    >
      <ScrollView>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Animatable.View animation="fadeInUp" style={styles.container}>
              <Text style={styles.title}>Register Patient</Text>
              {renderInput(
                "First Name",
                patientData.patient_first_name,
                "patient_first_name"
              )}
              {renderInput(
                "Last Name",
                patientData.patient_last_name,
                "patient_last_name"
              )}
              {renderInput(
                "Email",
                patientData.patient_email,
                "patient_email",
                "email-address"
              )}
              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}
              >
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Contact No."
                    value={patientData.patient_phone}
                    onChangeText={(text) =>
                      handleInputChange("patient_phone", text)
                    }
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}
              >
                <Picker
                  selectedValue={patientData.referral_source}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    handleInputChange("referral_source", itemValue)
                  }
                >
                  <Picker.Item label="Select Referral Source" value="" />
                  <Picker.Item label="Social Media" value="Social Media" />
                  <Picker.Item
                    label="Patient Reference"
                    value="Patient Reference"
                  />
                  <Picker.Item
                    label="Hospital Reference"
                    value="Hospital Reference"
                  />
                  <Picker.Item
                    label="Doctor Reference"
                    value="Doctor Reference"
                  />
                  <Picker.Item label="Other" value="Other" />
                </Picker>
              </Animatable.View>
              {patientData.referral_source &&
                patientData.referral_source !== "Social Media" && (
                  <Animatable.View
                    animation="fadeInUp"
                    style={styles.inputContainer}
                  >
                    <TextInput
                      style={styles.input}
                      placeholder="Referral Details"
                      value={patientData.referral_details}
                      onChangeText={(text) =>
                        handleInputChange("referral_details", text)
                      }
                    />
                  </Animatable.View>
                )}
              {patientData.referral_source === "Social Media" && (
                <Animatable.View
                  animation="fadeInUp"
                  style={styles.inputContainer}
                >
                  <Picker
                    selectedValue={patientData.referral_details}
                    style={styles.picker}
                    onValueChange={(itemValue) =>
                      handleInputChange("referral_details", itemValue)
                    }
                  >
                    <Picker.Item
                      label="Select Social Media Platform"
                      value=""
                    />
                    <Picker.Item label="Instagram" value="Instagram" />
                    <Picker.Item label="Facebook" value="Facebook" />
                    <Picker.Item label="WhatsApp" value="WhatsApp" />
                  </Picker>
                </Animatable.View>
              )}
              <TouchableOpacity
                style={styles.button}
                onPress={handlePatientRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backButton1}
                onPress={() => navigation.navigate("DoctorDashboard")}
              >
                <Text style={styles.backButtonText1}>Back to Home</Text>
              </TouchableOpacity>
            </Animatable.View>
          </ScrollView>
        </GestureHandlerRootView>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  picker: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  phonePrefix: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333333",
  },
  phoneInput: {
    flex: 1,
    padding: 10,
    color: "#333333",
  },
  scrollContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: "#119FB3",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 5,
    padding: 10,
    color: "#333333",
    backgroundColor: "#FFFFFF",
  },
  button: {
    backgroundColor: "#119FB3",
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  backButton1: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#119FB3",
  },
  backButtonText1: {
    color: "#119FB3",
    fontWeight: "bold",
  },
});

export default PatientRegister;
