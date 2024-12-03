import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import * as Animatable from "react-native-animatable";
import { useSession } from "../context/SessionContext";
import { Picker } from "@react-native-picker/picker";
import { handleError, showSuccessToast } from "../utils/errorHandler";
import BackTabTop from "./BackTopTab";
import instance from "../utils/axiosConfig";

type DoctorRegisterScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "DoctorRegister">;
};

const initialDoctorData = {
  doctor_first_name: "",
  doctor_last_name: "",
  doctor_email: "",
  doctor_phone: "",
  qualification: "",
  is_admin: false,
};

const initialFieldStatus = {
  doctor_first_name: false,
  doctor_last_name: false,
  doctor_email: false,
  doctor_phone: false,
  qualification: false,
};

const DoctorRegister: React.FC<DoctorRegisterScreenProps> = ({
  navigation,
}) => {
  const { idToken } = useSession();
  const [doctorData, setDoctorData] = useState(initialDoctorData);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldStatus, setFieldStatus] = useState(initialFieldStatus);

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;
    if (field === "doctor_first_name" || field === "doctor_last_name") {
      newValue = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (field === "doctor_phone") {
      newValue = value.replace(/[^0-9]/g, "");
    } else if (field === "doctor_email") {
      newValue = value.toLowerCase();
    }
    setDoctorData({ ...doctorData, [field]: newValue });
    setFieldStatus({ ...fieldStatus, [field]: newValue.length > 0 });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleDoctorRegister = async () => {
    if (!doctorData.doctor_first_name || !doctorData.doctor_last_name) {
      handleError(new Error("First name and last name are required"));
      return;
    }

    if (doctorData.doctor_phone.length !== 10) {
      handleError(new Error("Please enter a valid 10-digit phone number"));
      return;
    }
    if (!doctorData.doctor_email) {
      handleError(new Error("Email is required"));
      return;
    }

    if (!validateEmail(doctorData.doctor_email)) {
      handleError(new Error("Please enter a valid email address"));
      return;
    }

    if (!doctorData.qualification) {
      handleError(new Error("Qualification is required"));
      return;
    }

    setIsLoading(true);
    try {
      const formattedData = {
        ...doctorData,
        doctor_phone: "+91" + doctorData.doctor_phone,
      };

      const response = await instance.post("/doctor/create", formattedData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      showSuccessToast("Doctor registered successfully");
      setDoctorData(initialDoctorData);
      setFieldStatus(initialFieldStatus);
      navigation.navigate("DoctorDashboard");
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (field: string) => {
    const isMandatory = [
      "doctor_first_name",
      "doctor_last_name",
      "doctor_phone",
      "doctor_email",
      "qualification",
    ].includes(field);
    if (fieldStatus[field]) {
      return [styles.input, styles.filledInput];
    }
    return [
      styles.input,
      isMandatory ? styles.mandatoryInput : styles.optionalInput,
    ];
  };

  return (
    <ImageBackground
      source={require("../assets/bac2.jpg")}
      style={styles.backgroundImage}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BackTabTop screenName="Doctor" />

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Animatable.View animation="fadeInUp" style={styles.container}>
              <Text style={styles.title}>Register Doctor</Text>
              <Animatable.View
                animation="fadeInUp"
                style={styles.inputContainer}
              >
                <TextInput
                  style={getInputStyle("doctor_first_name")}
                  placeholder="First Name"
                  value={doctorData.doctor_first_name}
                  onChangeText={(text) =>
                    handleInputChange("doctor_first_name", text)
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={200}
                style={styles.inputContainer}
              >
                <TextInput
                  style={getInputStyle("doctor_last_name")}
                  placeholder="Last Name"
                  value={doctorData.doctor_last_name}
                  onChangeText={(text) =>
                    handleInputChange("doctor_last_name", text)
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={400}
                style={styles.inputContainer}
              >
                <TextInput
                  style={getInputStyle("doctor_email")}
                  placeholder="Email"
                  value={doctorData.doctor_email}
                  onChangeText={(text) =>
                    handleInputChange("doctor_email", text)
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={600}
                style={styles.inputContainer}
              >
                <View
                  style={[
                    styles.phoneInputContainer,
                    getInputStyle("doctor_phone"),
                  ]}
                >
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Contact No."
                    value={doctorData.doctor_phone}
                    onChangeText={(text) =>
                      handleInputChange("doctor_phone", text)
                    }
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={800}
                style={styles.inputContainer}
              >
                <TextInput
                  style={getInputStyle("qualification")}
                  placeholder="Qualification"
                  value={doctorData.qualification}
                  onChangeText={(text) =>
                    handleInputChange("qualification", text)
                  }
                />
              </Animatable.View>
              <Animatable.View
                animation="fadeInUp"
                delay={1000}
                style={styles.inputContainer}
              >
                <Text style={styles.labelText}>Role:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={doctorData.is_admin}
                    style={styles.picker}
                    onValueChange={(itemValue) =>
                      setDoctorData({ ...doctorData, is_admin: itemValue })
                    }
                  >
                    <Picker.Item label="Doctor" value={false} />
                    <Picker.Item label="Admin" value={true} />
                  </Picker>
                </View>
              </Animatable.View>
              <TouchableOpacity
                style={styles.button}
                onPress={handleDoctorRegister}
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
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  scrollContainer: {
    flexGrow: 1,
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
  labelText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  picker: {
    height: 45,
    width: "100%",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  phoneInput: {
    flex: 1,
    padding: 10,
    color: "#333333",
  },
  phonePrefix: {
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#119FB3",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    color: "#333333",
    backgroundColor: "#FFFFFF",
  },
  mandatoryInput: {
    borderColor: "#c30010", // Red for mandatory fields
  },
  optionalInput: {
    borderColor: "#90EE90", // Light green for optional fields
  },
  filledInput: {
    borderColor: "#90EE90", // Bright green for filled fields
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

export default DoctorRegister;
