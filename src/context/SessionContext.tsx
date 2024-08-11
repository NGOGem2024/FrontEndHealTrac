import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
  Dispatch,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, User } from "@react-native-google-signin/google-signin";
import axios from "axios";

interface GoogleTokens {
  accessToken: string;
  idToken: string | null;
  refreshToken: string | null;
}

interface SessionData {
  user: User;
  tokens: GoogleTokens;
}

interface SessionContextProps {
  session: SessionData | null;
  setSession: (session: SessionData | null) => void;
  logout: () => Promise<void>;
  refreshAllTokens: () => Promise<void>;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

const STORAGE_KEYS = {
  USER_SESSION: "userSession",
  GOOGLE_TOKENS: "googleTokens",
  TOKEN_EXPIRATION: "tokenExpirationTime",
  LIVESWITCH_TOKEN: "liveSwitchToken",
  LIVESWITCH_EXPIRATION: "liveSwitchTokenExpiresAt",
};

const API_ENDPOINT =
  "https://healtrackapp-production.up.railway.app/refresh-token";

const refreshGoogleTokens = async (
  logoutFunction: () => Promise<void>,
  setSession: Dispatch<SetStateAction<SessionData | null>>,
  session: SessionData
): Promise<GoogleTokens | null> => {
  try {
    const [storedTokens, expirationTime, refreshToken] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_TOKENS),
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRATION),
      AsyncStorage.getItem("googleRefreshToken"),
    ]);

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const now = Date.now();
    if (storedTokens && expirationTime && parseInt(expirationTime) > now) {
      console.log("Google tokens are still valid");
      return JSON.parse(storedTokens);
    }

    console.log("Refreshing Google tokens");
    const { data } = await axios.post(API_ENDPOINT, { refreshToken });
    const { accessToken, idToken } = data;
    console.log(data);
    const newTokens: GoogleTokens = {
      accessToken,
      idToken,
      refreshToken: "",
    };
    const newExpirationTime = now + 120000;

    await Promise.all([
      AsyncStorage.setItem(
        STORAGE_KEYS.GOOGLE_TOKENS,
        JSON.stringify(newTokens)
      ),
      AsyncStorage.setItem(
        STORAGE_KEYS.TOKEN_EXPIRATION,
        newExpirationTime.toString()
      ),
    ]);

    await checkLiveSwitchTokenExpiration(logoutFunction);

    const userInfo = await GoogleSignin.getCurrentUser();
    if (userInfo) {
      const sessionData: SessionData = { user: userInfo, tokens: newTokens };
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_SESSION,
        JSON.stringify(sessionData)
      );
      setSession(sessionData);
      console.log("New session created:", sessionData);
      console.log(session);
    }

    return newTokens;
  } catch (error) {
    console.error("Error refreshing Google tokens:", error);
    return null;
  }
};

const checkLiveSwitchTokenExpiration = async (
  logoutFunction: () => Promise<void>
) => {
  const [liveSwitchToken, liveSwitchExpiresAt] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.LIVESWITCH_TOKEN),
    AsyncStorage.getItem(STORAGE_KEYS.LIVESWITCH_EXPIRATION),
  ]);

  if (liveSwitchToken && liveSwitchExpiresAt) {
    const liveSwitchExpiration = parseInt(liveSwitchExpiresAt);
    if (Date.now() >= liveSwitchExpiration) {
      console.log("LiveSwitch token has expired");
      await logoutFunction();
    }
  }
};

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(
          STORAGE_KEYS.USER_SESSION
        );
        if (storedSession) {
          setSession(JSON.parse(storedSession));
          console.log("Session restored from AsyncStorage");
        } else {
          console.log("No stored session found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error fetching session from AsyncStorage:", error);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    const persistSession = async () => {
      if (session) {
        try {
          await refreshAllTokens();
          console.log("Session persisted to AsyncStorage");
        } catch (error) {
          console.error("Error persisting session to AsyncStorage:", error);
        }
      }
    };

    persistSession();
  }, [session]);

  const refreshAllTokens = async () => {
    try {
      const newGoogleTokens = await refreshGoogleTokens(
        logout,
        setSession,
        session
      );
      if (newGoogleTokens) {
        console.log("Google tokens refreshed successfully");
      }
    } catch (error) {
      console.error("Error refreshing tokens:", error);
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.configure();
      await GoogleSignin.signOut();
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION),
        AsyncStorage.removeItem(STORAGE_KEYS.GOOGLE_TOKENS),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRATION),
        AsyncStorage.removeItem(STORAGE_KEYS.LIVESWITCH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.LIVESWITCH_EXPIRATION),
      ]);
      setSession(null);
      console.log("Logout successful");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const setSessionAndPersist = async (newSession: SessionData | null) => {
    setSession((prevSession) => {
      if (JSON.stringify(prevSession) !== JSON.stringify(newSession)) {
        return newSession;
      }
      return prevSession;
    });
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession: setSessionAndPersist,
        logout,
        refreshAllTokens,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};
