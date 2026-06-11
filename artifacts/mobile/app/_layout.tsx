import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavizbanProvider } from "@/context/NavizbanContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ConsentScreen } from "@/components/ConsentScreen";

const CONSENT_KEY = "navizban_consent_v2";

// Web'de sistem fontlarını zorla (Times New Roman + Inter fallback)
function FontFix() {
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const id = "navizban-font-fix";
      if (!document.getElementById(id)) {
        const style = document.createElement("style");
        style.id = id;
        // SADECE Inter font kullanan elementleri hedefle, Ionicons vb. icon font'ları ezme!
        style.textContent = `
          html, body, #root {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          }
          [class*="Inter"], [style*="Inter"] {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
      // Font yüklenene kadar tekrar dene
      const timer = setInterval(() => {
        if (!document.getElementById(id)) {
          const style = document.createElement("style");
          style.id = id;
          style.textContent = `
            html, body, #root {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
            [class*="Inter"], [style*="Inter"] {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            }
          `;
          document.head.appendChild(style);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, []);
  return null;
}

function AppContent() {
  const [showConsent, setShowConsent] = useState(true);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored === "true") {
        setShowConsent(false);
        setConsentGiven(true);
      }
    } catch {}
    setConsentChecked(true);
  }, []);

  if (!consentChecked) return null;

  if (showConsent) {
    return (
      <ConsentScreen
        onAccept={() => {
          try { localStorage.setItem(CONSENT_KEY, "true"); } catch {}
          setConsentGiven(true);
          setShowConsent(false);
        }}
        onDecline={() => setShowConsent(false)}
      />
    );
  }

  return (
    <NavizbanProvider consentGiven={consentGiven} setConsent={setConsentGiven}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NavizbanProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FontFix />
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
