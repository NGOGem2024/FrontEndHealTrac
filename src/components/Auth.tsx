import React from "react";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "../utils/supabase";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useSession } from "../context/SessionContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthNavigationProp = StackNavigationProp<RootStackParamList, "Auth">;

export default function Auth() {
  const navigation = useNavigation<AuthNavigationProp>();
  const { setSession } = useSession();

  React.useEffect(() => {
    GoogleSignin.configure({
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.events.owned",
        "https://www.googleapis.com/auth/calendar.calendarlist",
        "https://www.googleapis.com/auth/calendar.calendars.readonly",
        "https://www.googleapis.com/auth/calendar.app.created",
        "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
      ],
      webClientId:
        "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com",
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Store Google tokens with expiration time
      await AsyncStorage.setItem("googleTokens", JSON.stringify(tokens));
      const expirationTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
      await AsyncStorage.setItem(
        "tokenExpirationTime",
        expirationTime.toString()
      );

      console.log(JSON.stringify(userInfo, null, 2));
      if (userInfo.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.idToken,
        });
        console.log(error, data);
        if (data) {
          setSession(data.session);
          navigation.navigate("AllPatients");
        } else {
          throw new Error("Authentication failed");
        }
      } else {
        throw new Error("No id token Present");
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
        console.error(error);
      }
    }
  };

  return (
    <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={signIn}
    />
  );
}
