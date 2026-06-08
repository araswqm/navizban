import React, { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useTheme, Colors } from "../context/ThemeContext";
import { NORTHBOUND_STATIONS } from "@workspace/navizban-core";
import type { TrainPosition } from "@workspace/navizban-core";

interface Props {
  trainPosition: TrainPosition | null;
  userLatitude: number | null;
  userLongitude: number | null;
  fromIndex: number;
  toIndex: number;
}

export function TrainMapNative({
  trainPosition,
  userLatitude,
  userLongitude,
  fromIndex,
  toIndex,
}: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: 38.5,
    longitude: 27.1,
    latitudeDelta: 0.4,
    longitudeDelta: 0.4,
  };

  // Rota koordinatları
  const routeCoords = NORTHBOUND_STATIONS.map((s) => ({
    latitude: s.lat,
    longitude: s.lng,
  }));

  // İstasyondaki markerlar
  const stationMarkers = NORTHBOUND_STATIONS.map((s, idx) => ({
    coordinate: { latitude: s.lat, longitude: s.lng },
    id: s.id,
    isFrom: idx === fromIndex,
    isTo: idx === toIndex,
  }));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsCompass
        toolbarEnabled={false}
        mapType="terrain"
        customMapStyle={
          isDark ? darkMapStyle : undefined
        }
      >
        {/* Rota hattı */}
        <Polyline
          coordinates={routeCoords}
          strokeColor={c.primary}
          strokeWidth={3}
          lineDashPattern={[1]}
        />

        {/* İstasyon markerları */}
        {stationMarkers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            title={NORTHBOUND_STATIONS.find((s) => s.id === m.id)?.name}
            pinColor={m.isFrom ? c.accent : m.isTo ? c.error : c.primary}
          />
        ))}

        {/* Tren imleci */}
        {trainPosition && (
          <Marker
            coordinate={{
              latitude: trainPosition.lat,
              longitude: trainPosition.lng,
            }}
            title={`🚆 ${trainPosition.etaMinutes} dk kaldı`}
            description={`İlerleme: %${trainPosition.progressPercent}`}
          >
            <View style={[styles.trainMarker, { backgroundColor: c.accent }]}>
              <View style={[styles.trainInner, { backgroundColor: "#FFFFFF" }]} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  trainMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  trainInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0D1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8B949E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0D1117" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#21262D" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#161B22" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0D1117" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#161B22" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#21262D" }] },
];
