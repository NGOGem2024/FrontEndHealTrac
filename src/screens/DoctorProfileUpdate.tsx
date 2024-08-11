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

const { width } = Dimensions.get("window");

interface ProfileInfo {
  _id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  qualification: string;
  organization_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctors_photo: string;
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
};

const DoctorProfileEdit: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(getTheme(theme)), [theme]);
  const { session, refreshAllTokens } = useSession();

  const [profileInfo, setProfileInfo] =
    useState<ProfileInfo>(initialProfileState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("useEffect triggered. Session:", session);
    if (session && session.tokens && session.tokens.idToken) {
      console.log("Calling fetchDoctorInfo");
      fetchDoctorInfo();
    } else {
      console.log("No valid session, setting isLoading to false");
      setIsLoading(false);
    }
  }, [session]);

  const fetchDoctorInfo = async () => {
    await refreshAllTokens();
    console.log("fetchDoctorInfo called");
    if (!session || !session.tokens || !session.tokens.idToken) {
      console.log("No valid session in fetchDoctorInfo");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Making API call to fetch doctor info");
      const response = await axios.get<ProfileInfo>(
        "https://healtrackapp-production.up.railway.app/doctor",
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      console.log("Received doctor info:", response.data);
      setProfileInfo(response.data);
    } catch (error) {
      console.error("Error fetching doctor info:", error);
      Alert.alert("Error", "Failed to fetch doctor information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileInfo, value: string) => {
    setProfileInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!session || !session.tokens || !session.tokens.idToken) {
      Alert.alert("Error", "You must be logged in to update your profile");
      return;
    }

    try {
      const response = await axios.put(
        `https://healtrackapp-production.up.railway.app/doctor/update/${profileInfo._id}`,
        {
          doctor_first_name: profileInfo.doctor_first_name,
          doctor_last_name: profileInfo.doctor_last_name,
          qualification: profileInfo.qualification,
        },
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );

      Alert.alert("Success", "Profile updated successfully");
      console.log("Profile saved:", response.data);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#119FB3" />
        <Text style={styles.loadingText}>Loading profile information...</Text>
      </View>
    );
  }

  if (!session || !session.tokens || !session.tokens.idToken) {
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>

        <View style={styles.profileImageContainer}>
          <Image source={profilePhoto} style={styles.profilePhoto} />
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="camera-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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
            <Text style={styles.label}>qualification </Text>
            <TextInput
              style={styles.input}
              value={profileInfo.qualification}
              onChangeText={(text) => handleInputChange("qualification", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileInfo.organization_name}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileInfo.doctor_email}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profileInfo.doctor_phone}
              editable={false}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
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
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: "#119FB3",
    },
    header: {
      padding: 16,
      paddingTop: 40,
      backgroundColor: "#119FB3",
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.card,
    },
    disabledInput: {
      backgroundColor: "#F0F0F0",
      color: "#888888",
    },
    profileImageContainer: {
      alignItems: "center",
      marginTop: 5,
      marginBottom: 30,
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
      backgroundColor: "#119FB3",
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
      color: "#119FB3",
      marginBottom: 5,
      fontWeight: "bold",
    },
    input: {
      backgroundColor: "#FFFFFF",
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: theme.colors.text,
      elevation: 8,
    },
    saveButton: {
      backgroundColor: "#119FB3",
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
      marginHorizontal: 2,
      width: "50%",
      height: "7%",
      marginTop: 10,
      marginBottom: 10,
      marginLeft: "25%",
    },
    saveButtonText: {
      //   color: theme.colors.card,
      color: "#FFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
  });

export default DoctorProfileEdit;
