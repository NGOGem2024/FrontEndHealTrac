import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface GoogleTokens {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
}

export const refreshGoogleTokens = async (): Promise<GoogleTokens | null> => {
  try {
    const storedTokens = await AsyncStorage.getItem("googleTokens");
    if (!storedTokens) {
      console.warn("No stored tokens found");
      return null;
    }

    const parsedTokens: GoogleTokens = JSON.parse(storedTokens);

    // Check if the access token is close to expiration (e.g., within 5 minutes)
    const expirationTime = await AsyncStorage.getItem("tokenExpirationTime");
    const currentTime = Date.now();
    if (
      expirationTime &&
      currentTime < parseInt(expirationTime) - 5 * 60 * 1000
    ) {
      console.log("Token still valid, no need to refresh");
      return parsedTokens;
    }

    console.log("Refreshing Google tokens");
    const { accessToken, idToken } = await GoogleSignin.getTokens();

    const newTokens: GoogleTokens = {
      accessToken,
      idToken,
      refreshToken: parsedTokens.refreshToken, // Keep the existing refresh token
    };

    // Store the new tokens
    await AsyncStorage.setItem("googleTokens", JSON.stringify(newTokens));

    // Set the new expiration time (1 hour from now, as Google tokens typically last for 1 hour)
    const newExpirationTime = Date.now() + 60 * 60 * 1000;
    await AsyncStorage.setItem(
      "tokenExpirationTime",
      newExpirationTime.toString()
    );

    return newTokens;
  } catch (error) {
    console.error("Error refreshing Google tokens:", error);
    return null;
  }
};
