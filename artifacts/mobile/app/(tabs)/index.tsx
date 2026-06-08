import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useTheme, Colors } from "../../context/ThemeContext";
import { useNavizban } from "../../context/NavizbanContext";
import { TopBar } from "../../components/TopBar";
import { InfoPanel } from "../../components/InfoPanel";
import { LiveTrainPanel } from "../../components/LiveTrainPanel";
import { NORTHBOUND_STATIONS } from "@workspace/navizban-core";

// Platforma göre harita seçimi
let TrainMap: any;
if (Platform.OS === "web") {
  TrainMap = require("../../components/TrainMap.web").TrainMapWeb;
} else {
  TrainMap = require("../../components/TrainMap.native").TrainMapNative;
}

export default function HomeScreen() {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const [panelVisible, setPanelVisible] = useState(true);

  const {
    fromIndex,
    toIndex,
    tripActive,
    trainPosition,
    latitude,
    longitude,
    simulationMode,
    liveTrains,
    loadingTrains,
    setFromIndex,
    setToIndex,
    startTrip,
    stopTrip,
    refreshLiveTrains,
  } = useNavizban();

  const fromStation = NORTHBOUND_STATIONS[fromIndex]?.name ?? "";
  const toStation = NORTHBOUND_STATIONS[toIndex]?.name ?? "";

  // Biniş istasyonu değişince canlı trenleri sorgula
  useEffect(() => {
    if (fromStation && !tripActive) {
      refreshLiveTrains();
    }
  }, [fromIndex, tripActive, refreshLiveTrains]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      {/* Üst çubuk */}
      <TopBar
        fromIndex={fromIndex}
        toIndex={toIndex}
        onFromChange={setFromIndex}
        onToChange={setToIndex}
      />

      {/* Harita */}
      <View style={styles.mapContainer}>
        <TrainMap
          trainPosition={trainPosition}
          userLatitude={latitude}
          userLongitude={longitude}
          fromIndex={fromIndex}
          toIndex={toIndex}
        />

        {/* Simülasyon modu etiketi */}
        {simulationMode && !tripActive && (
          <View style={[styles.simOverlay, { backgroundColor: c.warning + "20" }]}>
            <Text style={[styles.simOverlayText, { color: c.warning }]}>
              📡 GPS sinyali bulunamadı — simülasyon modunda
            </Text>
          </View>
        )}

        {/* Canlı tren paneli */}
        {!tripActive && (
          <View style={styles.liveTrainsOverlay}>
            <LiveTrainPanel
              trains={liveTrains}
              loading={loadingTrains}
              onRefresh={refreshLiveTrains}
              stationName={fromStation}
            />
          </View>
        )}
      </View>

      {/* Alt bilgi paneli */}
      <InfoPanel
        visible={panelVisible}
        onToggle={() => setPanelVisible(!panelVisible)}
        trainPosition={trainPosition}
        fromStation={fromStation}
        toStation={toStation}
        tripActive={tripActive}
        simulationMode={simulationMode}
        onStartTrip={startTrip}
        onStopTrip={stopTrip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  simOverlay: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  simOverlayText: {
    fontSize: 12,
    fontWeight: "500",
  },
  liveTrainsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
