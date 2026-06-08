import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, Colors } from "../context/ThemeContext";
import type { TrainPosition } from "@workspace/navizban-core";

interface Props {
  visible: boolean;
  onToggle: () => void;
  trainPosition: TrainPosition | null;
  fromStation: string;
  toStation: string;
  tripActive: boolean;
  simulationMode: boolean;
  onStartTrip: () => void;
  onStopTrip: () => void;
}

export function InfoPanel({
  visible,
  onToggle,
  trainPosition,
  fromStation,
  toStation,
  tripActive,
  simulationMode,
  onStartTrip,
  onStopTrip,
}: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;

  if (!visible) {
    return (
      <TouchableOpacity
        style={[styles.showButton, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={onToggle}
      >
        <Text style={[styles.showButtonText, { color: c.primary }]}>▲ Bilgileri Göster</Text>
      </TouchableOpacity>
    );
  }

  const eta = trainPosition?.etaMinutes ?? 0;
  const progress = trainPosition?.progressPercent ?? 0;
  const hasValidTrip = fromStation && toStation && fromStation !== toStation;

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      {/* Başlık çubuğu */}
      <TouchableOpacity style={styles.header} onPress={onToggle}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Yolculuk Bilgileri</Text>
        <Text style={[styles.hideText, { color: c.textSecondary }]}>▼ Gizle</Text>
      </TouchableOpacity>

      {/* Süre ve ilerleme */}
      {trainPosition && (
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Kalan Süre</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    eta <= 5
                      ? c.etaPositive
                      : eta <= 15
                      ? c.etaWarning
                      : c.text,
                },
              ]}
            >
              {eta} dk
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>İlerleme</Text>
            <Text style={[styles.infoValue, { color: c.primary }]}>{progress}%</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>{fromStation}</Text>
            <Text style={[styles.infoLabel, { color: c.textSecondary }]}>→ {toStation}</Text>
          </View>
        </View>
      )}

      {/* İlerleme çubuğu */}
      {trainPosition && (
        <View style={[styles.progressBar, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: c.primary,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      )}

      {/* Simülasyon uyarısı */}
      {simulationMode && (
        <View style={[styles.simBadge, { backgroundColor: c.warning + "30" }]}>
          <Text style={[styles.simText, { color: c.warning }]}>
            🧪 Simülasyon Modu — GPS sinyali zayıf
          </Text>
        </View>
      )}

      {/* Kontrol butonları */}
      <View style={styles.actions}>
        {!tripActive ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: hasValidTrip ? c.accent : c.border,
              },
            ]}
            onPress={onStartTrip}
            disabled={!hasValidTrip}
          >
            <Text style={styles.actionButtonText}>
              {hasValidTrip ? "🚄 Yolculuğu Başlat" : "🚉 İstasyon Seçin"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.error }]}
            onPress={onStopTrip}
          >
            <Text style={styles.actionButtonText}>⏹ Yolculuğu Bitir</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  hideText: {
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  simBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  simText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  showButton: {
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  showButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
