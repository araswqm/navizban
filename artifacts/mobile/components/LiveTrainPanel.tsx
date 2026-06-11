import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface LiveTrainInfo {
  trainId: string;
  fromStation: string;
  toStation: string;
  etaMinutes: number;
  direction: number;
  lastHeartbeat: number;
  source?: "gps" | "schedule" | "mock";
}

interface Props {
  trains: LiveTrainInfo[];
  loading: boolean;
}

function TrainRow({ train, C }: { train: LiveTrainInfo; C: any }) {
  return (
    <View style={[styles.trainRow, { borderBottomColor: C.border }]}>
      <View style={styles.trainInfo}>
        <View style={styles.trainTopRow}>
          <Text style={[styles.trainRoute, { color: C.text }]}>
            {train.fromStation} → {train.toStation}
          </Text>
          {train.source === "gps" && (
            <View style={[styles.sourceBadge, { backgroundColor: C.successMuted }]}>
              <Text style={[styles.sourceText, { color: C.success }]}>📍 Canlı</Text>
            </View>
          )}
          {train.source === "schedule" && (
            <View style={[styles.sourceBadge, { backgroundColor: C.warning + "30" }]}>
              <Text style={[styles.sourceText, { color: C.warning }]}>📋 Tarife</Text>
            </View>
          )}
        </View>
        <Text style={[styles.eta, { color: C.success }]}>
          {train.etaMinutes} dk sonra
        </Text>
      </View>
      {train.direction !== 0 && (
        <View
          style={[
            styles.directionBadge,
            { backgroundColor: train.direction === 1 ? C.accent + "30" : C.warning + "30" },
          ]}
        >
          <Text
            style={[styles.directionText, { color: train.direction === 1 ? C.accent : C.warning }]}
          >
            {train.direction === 1 ? "Kuzey" : "Güney"}
          </Text>
        </View>
      )}
    </View>
  );
}

export function LiveTrainPanel({ trains, loading }: Props) {
  const { C } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={C.accent} />
        <Text style={[styles.loadingText, { color: C.textSecondary }]}>
          Trenler sorgulanıyor...
        </Text>
      </View>
    );
  }

  if (trains.length === 0) {
    return null;
  }

  const visibleTrains = expanded ? trains : trains.slice(0, 1);
  const hiddenCount = trains.length - 1;

  return (
    <View style={styles.container}>
      {visibleTrains.map((train) => (
        <TrainRow key={train.trainId} train={train} C={C} />
      ))}

      {hiddenCount > 0 && !expanded && (
        <TouchableOpacity
          style={[styles.expandBtn, { borderColor: C.border }]}
          onPress={() => setExpanded(true)}
        >
          <Ionicons name="chevron-down" size={12} color={C.textMuted} />
          <Text style={[styles.expandText, { color: C.textMuted }]}>
            Diğer trenler ({hiddenCount})
          </Text>
        </TouchableOpacity>
      )}

      {expanded && hiddenCount > 0 && (
        <TouchableOpacity
          style={[styles.expandBtn, { borderColor: C.border }]}
          onPress={() => setExpanded(false)}
        >
          <Ionicons name="chevron-up" size={12} color={C.textMuted} />
          <Text style={[styles.expandText, { color: C.textMuted }]}>
            Gizle
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // kart yok — direkt top bar içinde
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  trainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trainInfo: {
    flex: 1,
  },
  trainTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  trainRoute: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 1,
  },
  sourceBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  sourceText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  eta: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expandText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
