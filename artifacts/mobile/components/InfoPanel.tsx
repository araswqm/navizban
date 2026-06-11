import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/context/ThemeContext";
import { useNavizban } from "@/context/NavizbanContext";

function formatMinutes(mins: number): string {
  const m = Math.floor(mins);
  if (m <= 0) return "0 dk";
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h} sa ${r} dk` : `${h} sa`;
  }
  return `${m} dk`;
}

function ProgressBar({ progress, C }: { progress: number; C: any }) {
  const widthAnim = useSharedValue(0);
  useEffect(() => {
    widthAnim.value = withTiming(Math.min(progress * 100, 100), { duration: 800 });
  }, [progress]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));
  return (
    <View style={[styles.barTrack, { backgroundColor: C.backgroundElevated }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: C.accent }, fillStyle]} />
    </View>
  );
}

export function InfoPanel() {
  const { C } = useTheme();
  const {
    boardingStation,
    destinationStation,
    totalMinutes,
    remainingMinutes,
    isJourneyActive,
    boardingMode,
    startJourney,
    stopJourney,
    infoPanelVisible,
    toggleInfoPanel,
    progress,
    proximityStatus,
  } = useNavizban();

  const isSameStation = boardingStation.id === destinationStation.id;
  const tooFar = proximityStatus === "too_far";
  const isManual = boardingMode === "manual";
  const canStart = !isSameStation && !tooFar && !isManual;
  const elapsedMinutes = totalMinutes - remainingMinutes;

  const btnAnim = useSharedValue(isJourneyActive ? 1 : 0);
  useEffect(() => {
    btnAnim.value = withTiming(isJourneyActive ? 1 : 0, { duration: 280 });
  }, [isJourneyActive]);

  const btnStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      btnAnim.value,
      [0, 1],
      [C.success, C.danger]
    ),
  }));

  const handleJourney = () => {
    if (!canStart && !isJourneyActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isJourneyActive ? stopJourney() : startJourney();
  };

  const remainText = isJourneyActive
    ? formatMinutes(Math.ceil(remainingMinutes))
    : isManual
    ? formatMinutes(totalMinutes)
    : formatMinutes(Math.ceil(remainingMinutes));

  const remainLabel = isJourneyActive ? "kalan" : isManual ? "tahmini" : "kalan";

  if (!infoPanelVisible) {
    return (
      <Pressable
        style={[styles.collapsed, { borderColor: C.border }]}
        onPress={() => { Haptics.selectionAsync(); toggleInfoPanel(); }}
      >
        <BlurView intensity={80} tint={C.blurTint} style={StyleSheet.absoluteFill} />
        <Ionicons name="chevron-up" size={18} color={C.textMuted} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.sheet, { borderTopColor: C.border }]}>
      <BlurView intensity={82} tint={C.blurTint} style={StyleSheet.absoluteFill} />

      <View style={[styles.handle, { backgroundColor: C.border }]} />

      <View style={styles.body}>
        <View style={styles.mainRow}>
          <View style={styles.stationsCol}>
            <View style={styles.stRow}>
              <View style={[styles.stDot, { backgroundColor: isManual ? C.warning : C.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stLabel, { color: C.textMuted }]}>
                  Biniş {isManual ? "· Manuel" : "· GPS"}
                </Text>
                <Text style={[styles.stName, { color: C.text }]} numberOfLines={1}>
                  {boardingStation.name}
                </Text>
              </View>
            </View>
            <View style={[styles.stConnector, { backgroundColor: C.border }]} />
            <View style={styles.stRow}>
              <View style={[styles.stDot, { backgroundColor: C.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stLabel, { color: C.textMuted }]}>Varış</Text>
                <Text style={[styles.stName, { color: C.text }]} numberOfLines={1}>
                  {destinationStation.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.timeBox}>
            {isSameStation ? (
              <Text style={[styles.timeDash, { color: C.textMuted }]}>—</Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.timeNum,
                    { color: C.success },
                    isJourneyActive && Platform.OS === "web" && {
                      textShadow: `0 0 14px ${C.successGlow}`,
                    } as any,
                    isJourneyActive && Platform.OS !== "web" && {
                      textShadowColor: C.success,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 10,
                    },
                  ]}
                >
                  {remainText}
                </Text>
                <Text style={[styles.timeUnit, { color: C.textMuted }]}>
                  {remainLabel}
                </Text>
              </>
            )}
          </View>
        </View>

        {!isSameStation && (
          <View style={styles.progressSection}>
            <ProgressBar progress={progress} C={C} />
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: C.textMuted }]}>
                {isJourneyActive ? `${formatMinutes(elapsedMinutes)} geçti` : isManual ? "Manuel mod · GPS gereksiz" : "Başlamadı"}
              </Text>
              <Text style={[styles.progressPct, { color: C.textMuted }]}>
                %{Math.round(progress * 100)}
              </Text>
            </View>
          </View>
        )}

        {tooFar && !isJourneyActive && !isManual && (
          <View style={[styles.warning, { backgroundColor: "rgba(251,188,4,0.08)", borderColor: "rgba(251,188,4,0.2)" }]}>
            <Ionicons name="warning-outline" size={13} color={C.warning} />
            <Text style={[styles.warningText, { color: C.warning }]}>Raylara 500 m'den uzaktasınız</Text>
          </View>
        )}

        {isManual && !isJourneyActive && (
          <View style={[styles.warning, { backgroundColor: "rgba(251,188,4,0.06)", borderColor: "rgba(251,188,4,0.15)" }]}>
            <Ionicons name="hand-left-outline" size={13} color={C.warning} />
            <Text style={[styles.warningText, { color: C.warning }]}>Manuel modda yolculuk başlatılamaz</Text>
          </View>
        )}

        <View style={styles.actions}>
          {!isManual ? (
            <Animated.View style={[styles.btn, canStart || isJourneyActive ? btnStyle : { backgroundColor: C.backgroundElevated }]}>
              <Pressable
                onPress={handleJourney}
                disabled={!canStart && !isJourneyActive}
                style={({ pressed }) => [
                  styles.btnInner,
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Ionicons
                  name={isJourneyActive ? "stop-circle-outline" : "navigate-outline"}
                  size={18}
                  color={(!canStart && !isJourneyActive) ? C.textMuted : "#fff"}
                />
                <Text style={[styles.btnText, (!canStart && !isJourneyActive) && { color: C.textMuted }]}>
                  {isJourneyActive ? "Durdur" : tooFar ? "Raya Yakın Değil" : "Yolculuğu Başlat"}
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View style={[styles.btn, styles.btnInfo, { backgroundColor: C.surfaceTint, borderColor: C.borderAccent }]}>
              <Ionicons name="time-outline" size={16} color={C.accent} />
              <Text style={[styles.btnText, { color: C.accent }]}>
                Tahmini: {formatMinutes(totalMinutes)}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => { Haptics.selectionAsync(); toggleInfoPanel(); }}
            style={[styles.hideBtn, { backgroundColor: C.backgroundElevated, borderColor: C.border }]}
          >
            <Ionicons name="chevron-down" size={18} color={C.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    opacity: 0.5,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stationsCol: {
    flex: 1,
    gap: 0,
  },
  stRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 3,
  },
  stConnector: {
    width: 1,
    height: 12,
    marginLeft: 3,
  },
  stDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  stLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  stName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  timeBox: {
    alignItems: "center",
    minWidth: 72,
  },
  timeNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  timeDash: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  timeUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressSection: {
    gap: 5,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  progressPct: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    overflow: "hidden",
  },
  btnInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  btnInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    color: "#fff",
  },
  hideBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  collapsed: {
    alignSelf: "center",
    marginBottom: 8,
    width: 44,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
