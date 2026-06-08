import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme, Colors } from "../context/ThemeContext";
import { NavizbanProvider, useNavizban } from "../context/NavizbanContext";
import { ConsentScreen } from "../components/ConsentScreen";
import { View, ActivityIndicator } from "react-native";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const { showConsent, consentGiven, setConsent } = useNavizban();
  const c = isDark ? Colors.dark : Colors.light;

  // Rıza ekranı gösteriliyor
  if (showConsent) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ConsentScreen
          onAccept={() => setConsent(true)}
          onDecline={() => setConsent(false)}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavizbanProvider>
        <RootLayoutInner />
      </NavizbanProvider>
    </ThemeProvider>
  );
}
