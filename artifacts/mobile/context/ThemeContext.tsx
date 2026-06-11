import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, useColorScheme } from "react-native";

import Colors, { ColorTheme, ThemeMode } from "@/constants/colors";

interface ThemeContextValue {
  mode: ThemeMode;
  C: ColorTheme;
  fadeAnim: Animated.Value;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("light");
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleTheme = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setMode((prev) => (prev === "dark" ? "light" : "dark"));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const C = mode === "dark" ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ mode, C, fadeAnim, toggleTheme }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
