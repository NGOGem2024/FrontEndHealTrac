import React, { useEffect } from "react";
import { TouchableOpacity, Text, View, StyleSheet, Alert } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../context/SessionContext";
import axiosInstance from "../utils/axiosConfig";

const GOOGLE_WEB_CLIENT_ID =
  "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com";

interface GoogleSignInButtonProps {
  onSignInSuccess: () => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSignInSuccess,
}) => {
  const { updateAccessToken } = useSession();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      await AsyncStorage.setItem("googleTokens", JSON.stringify(tokens));
      const expirationTime = Date.now() + 3300000; // 1 hour from now
      await AsyncStorage.setItem(
        "tokenExpirationTime",
        expirationTime.toString()
      );

      if (userInfo.serverAuthCode) {
        try {
          const response = await axiosInstance.post(`/exchange`, {
            serverAuthCode: userInfo.serverAuthCode,
          });
          const { accessToken } = response.data;
          await updateAccessToken(accessToken);
          onSignInSuccess(); // Call the success callback
        } catch (error) {
          console.error(
            "Error exchanging auth code:",
            error.response ? error.response.data : error.message
          );
          Alert.alert(
            "Error",
            "Failed to exchange auth code. Please try again."
          );
        }
      } else {
        console.warn("No serverAuthCode present in userInfo");
        Alert.alert(
          "Error",
          "Failed to obtain server auth code. Please try again."
        );
      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      Alert.alert("Error", "Failed to sign in with Google. Please try again.");
    }
  };

  return (
    <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
      <View style={styles.googleButtonContent}>
        <AntDesign
          name="google"
          size={24}
          color="white"
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: "#2a7fba",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: "95%",
    alignItems: "center",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GoogleSignInButton;
