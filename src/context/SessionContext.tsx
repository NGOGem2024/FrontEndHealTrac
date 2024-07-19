import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabase"; // Adjust the path if necessary
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

interface SessionContextProps {
  session: any;
  setSession: (session: any) => void;
  logout: () => Promise<void>;
}

interface GoogleTokens {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

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

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error);
      } else {
        setSession(data.session);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const refreshTokens = async () => {
      const newTokens = await refreshGoogleTokens();
      if (newTokens) {
        console.log("Tokens refreshed successfully");
        // You can update your session or state here if needed
      }
    };

    const interval = setInterval(refreshTokens, 50 * 60 * 1000); // Refresh tokens every 50 minutes
    return () => clearInterval(interval);
  }, []);
  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Sign out from Google
      await GoogleSignin.signOut();

      // Clear AsyncStorage
      await AsyncStorage.removeItem("userSession");
      await AsyncStorage.removeItem("googleTokens");
      await AsyncStorage.removeItem("tokenExpirationTime");

      // Clear the session state
      setSession(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  return (
    <SessionContext.Provider value={{ session, setSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};
