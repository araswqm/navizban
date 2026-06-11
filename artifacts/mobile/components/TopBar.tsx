import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/context/ThemeContext";
import { useNavizban } from "@/context/NavizbanContext";
import { NavizbanLogo } from "./NavizbanLogo";
import { StationPicker } from "./StationPicker";
import { LiveTrainPanel } from "./LiveTrainPanel";

export function TopBar() {
  const { C, mode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    boardingStation,
    destinationStation,
    boardingMode,
    locationPermission,
    isLoadingLocation,
    proximityStatus,
    liveTrains,
    loadingTrains,
    isJourneyActive,
  } = useNavizban();

  const [boardingPickerVisible, setBoardingPickerVisible] = useState(false);
  const [destPickerVisible, setDestPickerVisible] = useState(false);
  const [liveTrainsVisible, setLiveTrainsVisible] = useState(true);

  // Yolculuk başladığında tren panelini kapat
  useEffect(() => {
    if (isJourneyActive) {
      setLiveTrainsVisible(false);
    } else {
      setLiveTrainsVisible(true);
    }
  }, [isJourneyActive]);

  const topPad = Platform.OS === "web" ? 14 : insets.top;
  const locationOk = locationPermission === "granted";
  const isManual = boardingMode === "manual";
  const hasTrains = liveTrains.length > 0 || loadingTrains;

  return (
    <>
      <View style={[styles.container, { paddingTop: topPad, borderBottomColor: C.border }]}>
        <BlurView intensity={80} tint={C.blurTint} style={StyleSheet.absoluteFill} />

        <View style={styles.inner}>
          <View style={styles.titleRow}>
            <NavizbanLogo height={20} />
            <View style={{ flex: 1 }} />
            {hasTrains && (
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setLiveTrainsVisible(!liveTrainsVisible); }}
                style={[styles.themeBtn, { borderColor: C.border }]}
                hitSlop={8}
              >
                <Ionicons
                  name={liveTrainsVisible ? "eye-outline" : "eye-off-outline"}
                  size={14}
                  color={liveTrainsVisible ? C.accent : C.textMuted}
                />
              </Pressable>
            )}
            <Pressable
              onPress={() => { Haptics.selectionAsync(); toggleTheme(); }}
              style={[styles.themeBtn, { borderColor: C.border }]}
              hitSlop={8}
            >
              <Ionicons
                name={mode === "dark" ? "sunny-outline" : "moon-outline"}
                size={14}
                color={C.textMuted}
              />
            </Pressable>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); router.push("/settings"); }}
              style={[styles.themeBtn, { borderColor: C.border }]}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={14} color={C.textMuted} />
            </Pressable>
            <View style={[styles.gpsDot, { backgroundColor: locationOk ? C.success : C.danger }]} />
            <Text style={[styles.gpsText, { color: locationOk ? C.success : C.danger }]}>
              GPS
            </Text>
          </View>

          <View style={styles.routeRow}>
            <Pressable
              style={({ pressed }) => [
                styles.routeHalf,
                styles.routeLeft,
                {
                  backgroundColor: isManual
                    ? "rgba(251,188,4,0.08)"
                    : "rgba(255,255,255,0.05)",
                  borderColor: isManual ? "rgba(251,188,4,0.25)" : C.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => { Haptics.selectionAsync(); setBoardingPickerVisible(true); }}
            >
              <View style={[styles.dot, { backgroundColor: isManual ? C.warning : C.success }]} />
              <Text style={[styles.routeLabel, { color: C.textMuted }]}>Biniş</Text>
              <Text style={[styles.routeStation, { color: C.textSecondary }]} numberOfLines={1}>
                {isLoadingLocation && !isManual ? "Belirleniyor…" : boardingStation.name}
              </Text>
              {isManual && (
                <Ionicons name="hand-left-outline" size={10} color={C.warning} />
              )}
              {!isManual && !isLoadingLocation && proximityStatus === "too_far" && (
                <Ionicons name="warning" size={10} color={C.warning} />
              )}
            </Pressable>

            <Ionicons name="arrow-forward" size={11} color={C.textMuted} style={{ flexShrink: 0 }} />

            <Pressable
              style={({ pressed }) => [
                styles.routeHalf,
                styles.routeRight,
                {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderColor: C.border,
                },
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => { Haptics.selectionAsync(); setDestPickerVisible(true); }}
            >
              <View style={[styles.dot, { backgroundColor: C.accent }]} />
              <Text style={[styles.routeLabel, { color: C.textMuted }]}>Varış</Text>
              <Text style={[styles.routeStation, styles.routeStationDest, { color: C.text }]} numberOfLines={1}>
                {destinationStation.name}
              </Text>
              <Ionicons name="chevron-down" size={12} color={C.textMuted} style={{ flexShrink: 0 }} />
            </Pressable>
          </View>

          {liveTrainsVisible && hasTrains && (
            <View style={styles.liveTrainSection}>
              <LiveTrainPanel
                trains={liveTrains}
                loading={loadingTrains}
              />
            </View>
          )}
        </View>
      </View>

      <StationPicker
        visible={boardingPickerVisible}
        onClose={() => setBoardingPickerVisible(false)}
        mode="boarding"
      />
      <StationPicker
        visible={destPickerVisible}
        onClose={() => setDestPickerVisible(false)}
        mode="destination"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 7,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gpsText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeHalf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    minWidth: 0,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  routeLeft: { flex: 1 },
  routeRight: { flex: 1 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  routeLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    flexShrink: 0,
  },
  routeStation: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  routeStationDest: {
    fontFamily: "Inter_600SemiBold",
  },
  liveTrainSection: {
    marginTop: 4,
  },
});
