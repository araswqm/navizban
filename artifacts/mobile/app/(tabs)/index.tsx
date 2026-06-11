import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useNavizban } from "@/context/NavizbanContext";
import { TrainMap } from "@/components/TrainMap";
import { TopBar } from "@/components/TopBar";
import { InfoPanel } from "@/components/InfoPanel";

function HomeContent() {
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    isJourneyActive,
  } = useNavizban();
  const bottomPad = insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <TrainMap />
      <TopBar />
      <View style={[styles.bottomContainer, { paddingBottom: bottomPad }]}>
        <InfoPanel />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return <HomeContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
