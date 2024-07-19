import React, { useState, useMemo } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import { getTheme } from "./Theme";
// import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get("window");

interface ProfileInfo {
  firstName: string;
  lastName: string;
  specialization: string;
  organization: string;
  email: string;
  phone: string;
  profilePhoto: string;
}

const DoctorProfileEdit: React.FC = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => getStyles(getTheme(theme)), [theme]);

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    firstName: "Ana",
    lastName: "Mendis",
    specialization: "MD, MBBS",
    organization: "Arogya physiotherapy",
    email: "amendis@outlook.com",
    phone: "+91 7864562543",
    profilePhoto: require("../assets/profile.png"),
  });

  const handleInputChange = (field: keyof ProfileInfo, value: string) => {
    setProfileInfo((prev) => ({ ...prev, [field]: value }));
  };

  //   const handleImagePick = async () => {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       aspect: [1, 1],
  //       quality: 1,
  //     });

  //     if (!result.canceled) {
  //       setProfileInfo(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
  //     }
  //   };

  const handleSave = () => {
    // Implement save functionality here
    console.log("Profile saved:", profileInfo);
  };

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
          <Image
            source={
              typeof profileInfo.profilePhoto === "string"
                ? { uri: profileInfo.profilePhoto }
                : profileInfo.profilePhoto
            }
            style={styles.profilePhoto}
          />
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="camera-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.firstName}
              onChangeText={(text) => handleInputChange("firstName", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.lastName}
              onChangeText={(text) => handleInputChange("lastName", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialization</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.specialization}
              onChangeText={(text) => handleInputChange("specialization", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.organization}
              onChangeText={(text) => handleInputChange("organization", text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profileInfo.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
              keyboardType="phone-pad"
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
