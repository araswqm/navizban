import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { useTheme, Colors } from "../../context/ThemeContext";

export default function TabLayout() {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Navigasyon",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🚆" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="⚙️" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 22, color: color }}>{emoji}</Text>
    </View>
  );
}
