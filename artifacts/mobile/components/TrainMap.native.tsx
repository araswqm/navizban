import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { IZBAN_STATIONS, findNearestRouteIndex } from "@/constants/izban";
import { IZBAN_ROUTE_COORDS } from "@/constants/route";
import { useNavizban } from "@/context/NavizbanContext";
import { useTheme } from "@/context/ThemeContext";

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0A0E1A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0E1A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1A2235" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#243447" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060D1A" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1A2235" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#9CA3AF" }] },
];

const LIGHT_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#F1F3F4" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#BFD4E3" }] },
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
];

function PulsingTrainMarker() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.7, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.08, { duration: 900 }), withTiming(0.45, { duration: 900 })),
      -1, true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={markerStyles.wrapper}>
      <Animated.View style={[markerStyles.pulse, pulseStyle]} />
      <View style={markerStyles.dot} />
    </View>
  );
}

export function TrainMap() {
  const { mode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const {
    trainPosition,
    userLocation,
    boardingStation,
    destinationStation,
    isJourneyActive,
  } = useNavizban();

  const fromIdx = IZBAN_STATIONS.findIndex(s => s.id === boardingStation.id);
  const toIdx = IZBAN_STATIONS.findIndex(s => s.id === destinationStation.id);
  const minI = Math.min(fromIdx, toIdx);
  const maxI = Math.max(fromIdx, toIdx);

  const trainRouteIdx = findNearestRouteIndex(trainPosition.latitude, trainPosition.longitude);
  const boardingRouteIdx = fromIdx !== -1 ? findNearestRouteIndex(boardingStation.latitude, boardingStation.longitude) : 0;
  const destRouteIdx = toIdx !== -1 ? findNearestRouteIndex(destinationStation.latitude, destinationStation.longitude) : 0;
  const segLow = Math.min(boardingRouteIdx, destRouteIdx);
  const segHigh = Math.max(boardingRouteIdx, destRouteIdx);
  const trainClamped = Math.max(segLow, Math.min(trainRouteIdx, segHigh));

  const goingTowardLow = boardingRouteIdx > destRouteIdx;

  const dimCoords = IZBAN_ROUTE_COORDS;
  const activeSegCoords = IZBAN_ROUTE_COORDS.slice(segLow, segHigh + 1);
  const passedCoords = goingTowardLow
    ? IZBAN_ROUTE_COORDS.slice(trainClamped, segHigh + 1)
    : IZBAN_ROUTE_COORDS.slice(segLow, trainClamped + 1);
  const remainCoords = goingTowardLow
    ? IZBAN_ROUTE_COORDS.slice(segLow, trainClamped + 1)
    : IZBAN_ROUTE_COORDS.slice(trainClamped, segHigh + 1);

  useEffect(() => {
    if (isJourneyActive && mapRef.current) {
      mapRef.current.animateCamera(
        { center: { latitude: trainPosition.latitude, longitude: trainPosition.longitude }, zoom: 12 },
        { duration: 1500 }
      );
    }
  }, [isJourneyActive, trainPosition.latitude, trainPosition.longitude]);

  useEffect(() => {
    if (!isJourneyActive && mapRef.current) {
      const midLat = (boardingStation.latitude + destinationStation.latitude) / 2;
      const midLng = (boardingStation.longitude + destinationStation.longitude) / 2;
      const latDelta = Math.abs(boardingStation.latitude - destinationStation.latitude) * 1.6 + 0.15;
      const lngDelta = Math.abs(boardingStation.longitude - destinationStation.longitude) * 1.6 + 0.15;
      mapRef.current.animateToRegion({
        latitude: midLat, longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.3),
        longitudeDelta: Math.max(lngDelta, 0.2),
      }, 1000);
    }
  }, [boardingStation.id, destinationStation.id, isJourneyActive]);

  const mapStyle = mode === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{ latitude: 38.46, longitude: 27.12, latitudeDelta: 1.2, longitudeDelta: 1.0 }}
      customMapStyle={mapStyle}
      userInterfaceStyle={mode}
      showsCompass={false}
      showsScale={false}
      showsUserLocation={false}
    >
      <Polyline
        coordinates={dimCoords}
        strokeColor="rgba(255,255,255,0.13)"
        strokeWidth={2.5}
      />

      {!isJourneyActive ? (
        <Polyline
          coordinates={activeSegCoords}
          strokeColor="#1A73E8"
          strokeWidth={3.5}
        />
      ) : (
        <>
          <Polyline
            coordinates={passedCoords}
            strokeColor="rgba(255,255,255,0.32)"
            strokeWidth={3}
          />
          <Polyline
            coordinates={remainCoords}
            strokeColor="#1A73E8"
            strokeWidth={3.5}
          />
        </>
      )}

      {IZBAN_STATIONS.map((station, idx) => {
        const isBoarding = station.id === boardingStation.id;
        const isDest = station.id === destinationStation.id;
        const isOnRoute = idx >= minI && idx <= maxI;
        return (
          <Marker
            key={station.id}
            coordinate={{ latitude: station.latitude, longitude: station.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[
              stationDotStyles.base,
              isBoarding && stationDotStyles.boarding,
              isDest && stationDotStyles.destination,
              !isBoarding && !isDest && isOnRoute && stationDotStyles.onRoute,
              !isBoarding && !isDest && !isOnRoute && stationDotStyles.normal,
            ]} />
          </Marker>
        );
      })}

      {userLocation && (
        <Circle
          center={userLocation}
          radius={500}
          fillColor="rgba(52,168,83,0.09)"
          strokeColor="rgba(52,168,83,0.4)"
          strokeWidth={1.5}
        />
      )}

      <Marker
        coordinate={{ latitude: trainPosition.latitude, longitude: trainPosition.longitude }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges
      >
        <PulsingTrainMarker />
      </Marker>
    </MapView>
  );
}

const markerStyles = StyleSheet.create({
  wrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A73E8",
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1A73E8",
    borderWidth: 2.5,
    borderColor: "#fff",
  },
});

const stationDotStyles = StyleSheet.create({
  base: { width: 6, height: 6, borderRadius: 3 },
  normal: { backgroundColor: "rgba(255,255,255,0.15)" },
  onRoute: { backgroundColor: "rgba(26,115,232,0.45)" },
  boarding: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#34A853",
    borderWidth: 2, borderColor: "rgba(52,168,83,0.3)",
  },
  destination: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: "#1A73E8",
    borderWidth: 2, borderColor: "rgba(26,115,232,0.35)",
  },
});

const styles = StyleSheet.create({
  map: StyleSheet.absoluteFillObject,
});
