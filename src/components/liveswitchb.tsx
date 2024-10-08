import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CALLBACK_URL = "physio.gem.auth://callback";
const LIVESWITCH_CLIENT_ID = "ADRTBpRcrev3ebDN2Jdpd2ednNlFbw7B";

const LiveSwitchLoginButton = ({ onLoginSuccess }) => {
  const handleRedirect = async (url) => {
    if (url.includes("access_token=")) {
      const token = url.split("access_token=")[1].split("&")[0];
      const expire = url.split("expires_in=")[1].split("&")[0];
      const expiresAt = Date.now() + parseInt(expire) * 1000;
      await AsyncStorage.setItem(
        "liveSwitchTokenExpiresAt",
        expiresAt.toString()
      );
      await AsyncStorage.setItem("LiveTokens", token);
      onLoginSuccess(); // Call the success callback
    }
  };

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
        await handleRedirect(result.url);
      }
    } catch (error) {
      console.error("Error during LiveSwitch authentication:", error);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={signInWithLiveSwitch}>
      <Text style={styles.buttonText}>LiveSwitch Login</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2a7fba",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default LiveSwitchLoginButton;
