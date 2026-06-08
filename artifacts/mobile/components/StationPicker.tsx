import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme, Colors } from "../context/ThemeContext";
import { NORTHBOUND_STATIONS } from "@workspace/navizban-core";

interface Props {
  fromIndex: number;
  compact?: boolean;
}

export function StationPicker({ fromIndex, compact }: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;

  // Yakın istasyonları göster
  const start = Math.max(0, fromIndex - 2);
  const end = Math.min(NORTHBOUND_STATIONS.length - 1, fromIndex + 3);
  const visibleStations = NORTHBOUND_STATIONS.slice(start, end + 1);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      {visibleStations.map((st, i) => {
        const realIdx = start + i;
        const isCurrent = realIdx === fromIndex;
        return (
          <View key={st.id} style={styles.stationRow}>
            <View style={styles.dotContainer}>
              <View
                style={[
                  styles.dot,
                  isCurrent && { backgroundColor: c.primary, width: 14, height: 14 },
                  !isCurrent && { backgroundColor: c.border },
                ]}
              />
              {i < visibleStations.length - 1 && (
                <View style={[styles.connector, { backgroundColor: c.border }]} />
              )}
            </View>
            <Text
              style={[
                styles.stationName,
                { color: isCurrent ? c.primary : c.textSecondary },
                isCurrent && styles.currentStation,
              ]}
            >
              {st.name}
              {isCurrent ? " ◄" : ""}
            </Text>
            {!compact && (
              <Text style={[styles.stationTime, { color: c.textSecondary }]}>
                {st.arrivalMinutes}dk
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  dotContainer: {
    alignItems: "center",
    width: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  stationName: {
    fontSize: 14,
    paddingLeft: 8,
    paddingTop: 4,
    flex: 1,
  },
  currentStation: {
    fontWeight: "700",
    fontSize: 15,
  },
  stationTime: {
    fontSize: 12,
    paddingTop: 4,
    paddingRight: 16,
  },
  line: {},
});
