import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "../context/SessionContext";
import NetInfo from "@react-native-community/netinfo";

const instance = axios.create({
  baseURL: 'https://healtrackapp-production-b2ab.up.railway.app',
  //baseURL: "http://192.168.1.17:5000", 
  timeout: 60000, // 15 second timeout
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  async (config) => {
    // Add network connection check
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error("No internet connection available");
    }

    const idToken = await AsyncStorage.getItem("userToken");
    const accessToken = await AsyncStorage.getItem("googleAccessToken");
    const liveSwitchToken = await AsyncStorage.getItem("LiveTokens");
    const liveSwitchTokenExpiresAt = await AsyncStorage.getItem(
      "liveSwitchTokenExpiresAt"
    );

    if (liveSwitchToken && liveSwitchTokenExpiresAt) {
      const liveSwitchExpiration = parseInt(liveSwitchTokenExpiresAt);

      if (Date.now() >= liveSwitchExpiration) {
        console.log("Here");
        await AsyncStorage.removeItem("LiveTokens");
        await AsyncStorage.removeItem("liveSwitchTokenExpiresAt");
      }
    }

    if (idToken) {
      config.headers["Authorization"] = `Bearer ${idToken}`;
    }

    if (accessToken) {
      config.headers["auth"] = `Bearer ${accessToken}`;
    }

    if (liveSwitchToken /* && !isTokenExpired(expiresIn)*/) {
      config.headers["x-liveswitch-token"] = liveSwitchToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  async (response) => {
    // Check if the response contains a new access token in the headers
    const newAccessToken = response.headers["newAccessToken"]; // or the key that holds your access token in the header
    if (newAccessToken) {
      // Use the updateAccessToken method to store the new access token
      console.log("here1 :", newAccessToken);
      const { updateAccessToken } = useSession();
      await updateAccessToken(newAccessToken);
    }
    return response;
  },
  async (error) => {
    if (error.code === "ECONNABORTED") {
      // Handle timeout error
      throw new Error(
        "Request timed out. Please check your internet connection."
      );
    }

    if (!error.response) {
      // Network error (server not reachable)
      throw new Error(
        "Unable to reach the server. Please check your internet connection."
      );
    }

    if (error.response && error.response.status === 401) {
      // Handle token expiration and logout logic
      await AsyncStorage.removeItem("userToken");
      // Optionally redirect to login screen
    }
    return Promise.reject(error);
  }
);
export default instance;
