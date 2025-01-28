import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
  User,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GoogleSignInButton from "../components/googlebutton";
import axiosInstance from "../utils/axiosConfig";
import axios from "axios";
import { handleError } from "../utils/errorHandler";
import BackTabTop from "./BackTopTab";
import { useSession } from "../context/SessionContext";

interface SessionInfo {
  lastUpdated?: string;
  updatedBy?: string;
  organization_name?: string;
  doctor_name?: string;
}

interface GoogleSignInResponse {
  data: {
    serverAuthCode: string;
    user: User;
    idToken: string;
    scopes: string[];
  };
  type: string;
}

interface ServerResponse {
  accessToken: string;
}
const GOOGLE_WEB_CLIENT_ID =
  "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com";

const SettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const { updateAccessToken } = useSession();

  const fetchSessionStatus = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get/googlestatus`);
      if (response.data) {
        setSessionInfo(response.data);
      } else {
        setSessionInfo(null);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Error fetching status:", error.response?.status);
        setSessionInfo(null);
      } else {
        handleError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // Configure Google Sign-In if not already configured
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

      // Check Play Services
      await GoogleSignin.hasPlayServices();

      // Perform sign in
      const userInfo = await GoogleSignin.signIn();

      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      await AsyncStorage.setItem("googleTokens", JSON.stringify(tokens));

      const expirationTime = Date.now() + 3300000; // 55 minutes from now
      await AsyncStorage.setItem(
        "tokenExpirationTime",
        expirationTime.toString()
      );

      // Check for serverAuthCode
      if (!userInfo.serverAuthCode) {
        // If no serverAuthCode, we need to explicitly request it
        await GoogleSignin.signOut(); // Sign out first
        const userInfoWithCode = await GoogleSignin.signIn();

        if (!userInfoWithCode.serverAuthCode) {
          throw new Error("Failed to obtain server auth code");
        }

        // Exchange the auth code
        const response = await axiosInstance.post<ServerResponse>("/exchange", {
          serverAuthCode: userInfoWithCode.serverAuthCode,
        });

        const { accessToken } = response.data;
        await updateAccessToken(accessToken);
        await fetchSessionStatus();
        console.log("Google Sign-In successful");
      } else {
        // Exchange the auth code we already have
        const response = await axiosInstance.post<ServerResponse>("/exchange", {
          serverAuthCode: userInfo.serverAuthCode,
        });

        const { accessToken } = response.data;
        await updateAccessToken(accessToken);
        await fetchSessionStatus();
        console.log("Google Sign-In successful");
      }
    } catch (error) {
      let errorMessage = "Failed to sign in with Google. Please try again.";

      if (error instanceof Error) {
        switch (error.message) {
          case statusCodes.SIGN_IN_CANCELLED:
            errorMessage = "Sign in was cancelled";
            break;
          case statusCodes.IN_PROGRESS:
            errorMessage = "Sign in is already in progress";
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            errorMessage = "Play services are not available";
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }

      console.error("Error during Google Sign-In:", error);
      Alert.alert("Error", errorMessage);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <BackTabTop screenName="Settings" />
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Calendar Integration</Text>

          {sessionInfo ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Doctor:</Text>
                <Text style={styles.value}>{sessionInfo.doctor_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Organization:</Text>
                <Text style={styles.value}>
                  {sessionInfo.organization_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Last Synced:</Text>
                <Text style={styles.value}>
                  {formatDate(sessionInfo.lastUpdated || "")}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Synced By:</Text>
                <Text style={styles.value}>{sessionInfo.updatedBy}</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={handleGoogleSignIn}
                >
                  <Text style={styles.buttonText}>Update Integration</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.refreshButton]}
                  onPress={fetchSessionStatus}
                >
                  <Text style={styles.buttonText}>Refresh Status</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.signInContainer}>
              <Text style={styles.noteText}>
                Connect your Google Calendar to sync appointments
              </Text>
              <GoogleSignInButton onSignInSuccess={fetchSessionStatus} />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  updateButton: {
    backgroundColor: "#2a7fba", // Changed to match Google sign-in button color
  },
  refreshButton: {
    backgroundColor: '#007B8E',
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signInContainer: {
    alignItems: "center",
    gap: 15,
  },
  noteText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
});

export default SettingsScreen;
