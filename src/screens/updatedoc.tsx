import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
import axios from "axios";
import { useSession } from "../context/SessionContext";
import { RootStackParamList } from "../types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { Picker } from "@react-native-picker/picker";
import { RadioButton } from "react-native-paper";
import { handleError, showSuccessToast } from "../utils/errorHandler";
import axiosInstance from "../utils/axiosConfig";
import BackTabTop from "./BackTopTab";
import LoadingScreen from "../components/loadingScreen";
import { CustomPicker, CustomRadioGroup } from "./customradio";

const { width } = Dimensions.get("window");

type DoctorScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "UpdateDoctor">;
  route: { params: { doctorId: string } };
};

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
  is_admin: boolean;
  status: string;
}

const initialProfileState: ProfileInfo = {
  _id: "",
  doctor_first_name: "",
  doctor_last_name: "",
  qualification: "",
  organization_name: "",
  doctor_email: "",
  doctor_phone: "",
  doctors_photo: "",
  is_admin: false,
  status: "active",
};

const EditDoctor: React.FC<DoctorScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(getTheme(theme)), [theme]);
  const { session } = useSession();
  const { doctorId } = route.params;
  const [profileInfo, setProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [originalProfileInfo, setOriginalProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    setEmailError(isValid ? null : "Please enter a valid email address");

    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    const isValid = indianPhoneRegex.test(cleanPhone);

    setPhoneError(
      isValid ? null : "Please enter a valid phone number starting with 6-9"
    );

    return isValid;
  };
  useEffect(() => {
    if (session.idToken) {
      fetchDoctorInfo();
    } else {
      setIsLoading(false);
    }
  }, [session.idToken]);

  const fetchDoctorInfo = async () => {
    if (!session.idToken) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.get<ProfileInfo>(
        `/doctor/${doctorId}`,
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        }
      );
      setProfileInfo(response.data);
      setOriginalProfileInfo(response.data);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePhoneChange = (value: string) => {
    let formattedValue = value;
    if (!value.startsWith("+91")) {
      formattedValue = "+91 " + value.replace(/[^\d]/g, "");
    }
    const maxLength = 14;
    const truncatedValue = formattedValue.slice(0, maxLength);
    const cleanValue = truncatedValue.replace(/[^\d+]/g, "");
    const finalValue =
      cleanValue.length > 3
        ? `${cleanValue.slice(0, 3)} ${cleanValue.slice(3)}`
        : cleanValue;

    setProfileInfo((prev) => ({ ...prev, doctor_phone: finalValue }));
    validatePhone(finalValue);
  };

  const handleInputChange = (field: keyof ProfileInfo, value: any) => {
    if (field === "doctor_phone") {
      handlePhoneChange(value);
    } else if (field === "doctor_email") {
      setProfileInfo((prev) => ({ ...prev, doctor_email: value }));
      validateEmail(value);
    } else {
      setProfileInfo((prev) => ({ ...prev, [field]: value }));
    }
  };

  const hasChanges = () => {
    return JSON.stringify(profileInfo) !== JSON.stringify(originalProfileInfo);
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      showSuccessToast("No changes were made to the profile.");
      return;
    }

    if (!session.idToken) {
      handleError(new Error("You must be logged in to update the profile"));
      return;
    }

    const isPhoneValid = validatePhone(profileInfo.doctor_phone);
    const isEmailValid = validateEmail(profileInfo.doctor_email);
    if (!isPhoneValid || !isEmailValid) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian mobile number starting with 6-9"
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await axiosInstance.put(
        `/doctor/update/${profileInfo._id}`,
        {
          doctor_first_name: profileInfo.doctor_first_name,
          doctor_last_name: profileInfo.doctor_last_name,
          qualification: profileInfo.qualification,
          doctor_email: profileInfo.doctor_email,
          doctor_phone: profileInfo.doctor_phone,
          is_admin: profileInfo.is_admin,
          status: profileInfo.status,
        },
        {
          headers: {
            Authorization: `Bearer ${session.idToken}`,
          },
        }
      );

      setOriginalProfileInfo(profileInfo);
      showSuccessToast("Profile updated successfully");
      navigation.navigate("Doctor", { doctorId: profileInfo._id });
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingScreen />
      </View>
    );
  }


  if (!session.idToken) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Please log in to edit your profile.
        </Text>
      </View>
    );
  }

  const profilePhoto = profileInfo.doctors_photo
    ? { uri: profileInfo.doctors_photo }
    : require("../assets/profile.png");

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackTabTop screenName="Doctor Profile" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileImageContainer}>
          <Image source={profilePhoto} style={styles.profilePhoto} />
          <TouchableOpacity style={styles.editImageButton}></TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_first_name}
              onChangeText={(text) =>
                handleInputChange("doctor_first_name", text)
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.doctor_last_name}
              onChangeText={(text) =>
                handleInputChange("doctor_last_name", text)
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.qualification}
              onChangeText={(text) => handleInputChange("qualification", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              value={profileInfo.doctor_email}
              onChangeText={(text) => handleInputChange("doctor_email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, phoneError && styles.inputError]}
              value={profileInfo.doctor_phone}
              onChangeText={(text) => handleInputChange("doctor_phone", text)}
              keyboardType="phone-pad"
              placeholder="+91 Enter 10-digit mobile number"
              maxLength={14} // +91 + space + 10 digits
            />
            {phoneError && <Text style={styles.errorText}>{phoneError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <CustomPicker
              selectedValue={profileInfo.is_admin}
              onValueChange={value => handleInputChange('is_admin', value)}
              label="Role"
              style={styles.input}
              textColor='black'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <CustomRadioGroup
              value={profileInfo.status}
              onValueChange={value => handleInputChange('status', value)}
              options={[
                {label: 'Active', value: 'active'},
                {label: 'Inactive', value: 'inactive'},
              ]}
              label="Status"
              textColor='black'
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.savingButton]}
            onPress={handleSave}
            disabled={isSaving || !hasChanges()}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: '#007B8E',
    },

    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    profileImageContainer: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 20,
    },
    profilePhoto: {
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 3,
      borderColor: theme.colors.card,
    },
    editImageButton: {
      position: "absolute",
      bottom: 0,
      right: width / 2 - 75,
      backgroundColor: '#007B8E',
      borderRadius: 20,
      padding: 8,
    },
    formContainer: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      color:'#007B8E',
      marginBottom: 5,
      fontWeight: "bold",
    },
    labelText: {
      fontSize: 16,
      marginBottom: 5,
      color: "#333333",
    },
    input: {
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      elevation: 8,
    },
    disabledInput: {
      backgroundColor: "#F0F0F0",
      color: "#888888",
    },
    picker: {
      borderWidth: 1,
      borderColor: "#D9D9D9",
      borderRadius: 5,
      backgroundColor: "#FFFFFF",
    },
    radioButtonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: '#007B8E',
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 2,
      marginTop: 10,
      marginBottom: 10,
    },
    savingButton: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    inputError: {
      borderColor: "red",
      borderWidth: 1,
    },
    errorText: {
      color: "red",
      fontSize: 12,
      marginTop: 5,
    },
  });

export default EditDoctor;
