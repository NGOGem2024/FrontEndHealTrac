import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeType = "purple" | "blue" | "green" | "orange" | "pink" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>("green");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem("theme").then((savedTheme) => {
      if (savedTheme) setTheme(savedTheme as ThemeType);
      setIsLoading(false);
    });
  }, []);

  const updateTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    AsyncStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
