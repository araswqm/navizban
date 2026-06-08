import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  isDark: true,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const isDark = useMemo(() => {
    if (mode === "system") return system === "dark";
    return mode === "dark";
  }, [mode, system]);

  const value = useMemo(
    () => ({ mode, isDark, setMode, toggle }),
    [mode, isDark, setMode, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const Colors = {
  dark: {
    background: "#0D1117",
    surface: "#161B22",
    surfaceLight: "#21262D",
    primary: "#58A6FF",
    accent: "#3FB950",
    warning: "#D29922",
    error: "#F85149",
    text: "#E6EDF3",
    textSecondary: "#8B949E",
    border: "#30363D",
    card: "#161B22",
    trainColor: "#58A6FF",
    etaPositive: "#3FB950",
    etaWarning: "#D29922",
  },
  light: {
    background: "#FFFFFF",
    surface: "#F6F8FA",
    surfaceLight: "#EEF1F5",
    primary: "#0969DA",
    accent: "#1A7F37",
    warning: "#9A6700",
    error: "#CF222E",
    text: "#1F2328",
    textSecondary: "#656D76",
    border: "#D0D7DE",
    card: "#F6F8FA",
    trainColor: "#0969DA",
    etaPositive: "#1A7F37",
    etaWarning: "#9A6700",
  },
};
