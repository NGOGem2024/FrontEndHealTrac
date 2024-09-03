import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { RootStackNavProps } from "../types/types";
import { useSession } from "../context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import axios from "axios";

const CALLBACK_URL = "physio.gem.auth://callback";
const GOOGLE_WEB_CLIENT_ID =
  "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com";
const LIVESWITCH_CLIENT_ID = "ADRTBpRcrev3ebDN2Jdpd2ednNlFbw7B";
const API_BASE_URL = "https://healtrackapp-production.up.railway.app";

export default function Auth() {
  const navigation = useNavigation<RootStackNavProps<"Auth">["navigation"]>();
  const { setSession, refreshAllTokens } = useSession();
  const [liveSwitchToken, setLiveSwitchToken] = useState("");

  useEffect(() => {
    const configureGoogleSignIn = async () => {
      await GoogleSignin.configure({
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/calendar.events",
        ],
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
        forceCodeForRefreshToken: true, // This ensures that you always get a refresh token.
        // Added prompt parameter
      });
    };

    configureGoogleSignIn();

    const subscription = Linking.addEventListener("url", handleRedirect);
    return () => subscription.remove();
  }, []);

  const handleRedirect = useCallback(async (event: Linking.EventType) => {
    if (Platform.OS === "ios") {
      WebBrowser.dismissAuthSession();
    }

    if (event.url) {
      const url = event.url;

      if (url.includes("access_token=")) {
        const token = url.split("access_token=")[1].split("&")[0];
        const expiresIn = url.split("expires_in=")[1].split("&")[0];

        setLiveSwitchToken(token);
        await AsyncStorage.setItem("liveSwitchToken", token);
        const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
        await AsyncStorage.setItem(
          "liveSwitchTokenExpiresAt",
          expiresAt.toString()
        );

        await completeAuthentication();
      } else {
        Alert.alert(
          "Authentication Error",
          "Failed to obtain LiveSwitch token."
        );
      }
    } else {
      Alert.alert("Authentication Error", "No redirect URL received.");
    }
  }, []);

  const signInWithLiveSwitch = async () => {
    try {
      const redirectUri = makeRedirectUri({ native: CALLBACK_URL });
      const authUrl = `https://public-api.production.liveswitch.com/v1/tokens?responseType=Token&clientId=${LIVESWITCH_CLIENT_ID}&callbackUrl=${encodeURIComponent(
        CALLBACK_URL
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: true,
        }
      );

      if (result.type === "success" && result.url) {
        await handleRedirect({ url: result.url } as Linking.EventType);
      } else {
        Alert.alert(
          "Authentication Issue",
          `Authentication was not completed. Result: ${result.type}`
        );
      }
    } catch (error) {
      console.error("Error during LiveSwitch authentication:", error);
      Alert.alert(
        "Authentication Error",
        "An error occurred during LiveSwitch authentication."
      );
    }
  };

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
          const response = await axios.post(`${API_BASE_URL}/exchange`, {
            serverAuthCode: userInfo.serverAuthCode,
          });

          const { refreshToken } = response.data;
          if (refreshToken) {
            await AsyncStorage.setItem("googleRefreshToken", refreshToken);
          } else {
            console.warn("No refresh token received from server");
          }
        } catch (error) {
          console.error(
            "Error exchanging auth code:",
            error.response ? error.response.data : error.message
          );
        }
      } else {
        console.warn("No serverAuthCode present in userInfo");
      }

      if (userInfo.idToken) {
        const sessionData = { user: userInfo, tokens };
        await AsyncStorage.setItem("userSession", JSON.stringify(sessionData));
        await signInWithLiveSwitch();
      } else {
        throw new Error("No id token present");
      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      Alert.alert("Error", "Failed to sign in with Google.");
    }
  };

  const completeAuthentication = async () => {
    try {
      await refreshAllTokens();
      const storedSession = await AsyncStorage.getItem("userSession");
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        await setSession(sessionData);
        navigation.navigate("DoctorDashboard");
      } else {
        throw new Error("No stored session found");
      }
    } catch (error) {
      console.error("Error completing authentication:", error);
      Alert.alert("Error", "Failed to complete authentication.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Text style={styles.title1}>Welcome to HealTrack</Text>
      <Text style={styles.subtitle}>
        Please sign in with Google for the best experience
      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 50,
    marginTop: "10%",
    marginVertical: 50,
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
  title1: {
    fontSize: 18,
    marginBottom: 10,
  },
  title: {
    fontSize: 50,
    marginBottom: 20,
    color: "black",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: "#2a7fba",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: "95%",
    alignItems: "center",
  },
});
