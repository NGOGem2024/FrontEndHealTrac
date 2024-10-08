import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    isLoggedIn: false,
    idToken: null,
    accessToken: null,
    is_admin: false,
    doctor_id: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const idToken = await AsyncStorage.getItem("userToken");
        const accessToken = await AsyncStorage.getItem("googleAccessToken");
        const isadmin = await AsyncStorage.getItem("is_admin");
        const doctor_id = await AsyncStorage.getItem("doctor_id");
        const is_admin = isadmin === "true";
        if (idToken) {
          setSession({
            isLoggedIn: true,
            idToken,
            accessToken,
            is_admin,
            doctor_id,
          });
        }
      } catch (error) {
        console.error("Error loading session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("is_admin");
    await AsyncStorage.removeItem("doctor_id");
    await AsyncStorage.removeItem("googleAccessToken");
    await AsyncStorage.removeItem("LiveTokens");
    await AsyncStorage.removeItem("expires_in");
    setSession({
      isLoggedIn: false,
      idToken: null,
      accessToken: null,
      is_admin: false,
      doctor_id: null,
    });
  };

  const updateAccessToken = async (newAccessToken) => {
    await AsyncStorage.setItem("googleAccessToken", newAccessToken);
    setSession((prevSession) => ({
      ...prevSession,
      accessToken: newAccessToken,
    }));
  };

  return (
    <SessionContext.Provider
      value={{ session, setSession, logout, isLoading, updateAccessToken }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
