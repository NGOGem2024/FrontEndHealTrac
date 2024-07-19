import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  React.useEffect(() => {
    GoogleSignin.configure({
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      webClientId:
        "1038698506388-eegihlhipbg4d1cubdjk4p44gv74sv5i.apps.googleusercontent.com",
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

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

  const signInWithEmail = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data) {
        setSession(data.session);
        navigation.navigate("AllPatients");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        resizeMode="cover"
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to HealTrac</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.subtitle}>
        It is recommended to Login With Google for a better experience
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={signInWithEmail}>
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
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
  },
  logo: {
    width: 120,
    height: 120,
    marginTop: -50,
    marginBottom: 10,
    borderRadius: 100,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
