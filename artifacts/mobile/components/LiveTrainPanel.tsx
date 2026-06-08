import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme, Colors } from "../context/ThemeContext";
import type { LiveTrainInfo } from "../context/NavizbanContext";

interface Props {
  trains: LiveTrainInfo[];
  loading: boolean;
  onRefresh: () => void;
  stationName: string;
}

export function LiveTrainPanel({ trains, loading, onRefresh, stationName }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
        <ActivityIndicator size="small" color={c.primary} />
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>
          Trenler sorgulanıyor...
        </Text>
      </View>
    );
  }

  if (trains.length === 0) {
    return null; // Yaklaşan tren yoksa gösterme
  }

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>
          🚄 {stationName} istasyonuna yaklaşan trenler
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={[styles.refresh, { color: c.primary }]}>Yenile</Text>
        </TouchableOpacity>
      </View>
      {trains.map((train) => (
        <View key={train.trainId} style={[styles.trainRow, { borderBottomColor: c.border }]}>
          <View style={styles.trainInfo}>
            <Text style={[styles.trainRoute, { color: c.text }]}>
              {train.fromStation} → {train.toStation}
            </Text>
            <Text style={[styles.eta, { color: c.etaPositive }]}>
              {train.etaMinutes} dk sonra
            </Text>
          </View>
          <View
            style={[
              styles.directionBadge,
              {
                backgroundColor:
                  train.direction === 1 ? c.primary + "30" : c.warning + "30",
              },
            ]}
          >
            <Text
              style={[
                styles.directionText,
                { color: train.direction === 1 ? c.primary : c.warning },
              ]}
            >
              {train.direction === 1 ? "Kuzey" : "Güney"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  refresh: {
    fontSize: 13,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  trainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trainInfo: {
    flex: 1,
  },
  trainRoute: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  eta: {
    fontSize: 18,
    fontWeight: "700",
  },
  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
