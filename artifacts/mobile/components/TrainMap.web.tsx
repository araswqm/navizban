import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { IZBAN_STATIONS, findNearestRouteIndex } from "@/constants/izban";
import { IZBAN_ROUTE_COORDS } from "@/constants/route";
import { useNavizban } from "@/context/NavizbanContext";
import { useTheme } from "@/context/ThemeContext";

declare global {
  interface Window { L: any; }
}

function buildMapCss(mode: "dark" | "light") {
  const bg = mode === "dark" ? "#0A0E1A" : "#F8F8F8";
  const ctrl = mode === "dark" ? "#1C1E26" : "#FFFFFF";
  const ctrlBorder = mode === "dark" ? "rgba(26,115,232,0.25)" : "rgba(26,115,232,0.3)";
  const attrBg = mode === "dark" ? "rgba(10,14,26,0.8)" : "rgba(255,255,255,0.85)";
  const attrColor = mode === "dark" ? "#6B7280" : "#888888";
  const tileFilter = mode === "dark" ? "brightness(0.85) saturate(0.7)" : "none";
  return `
    .leaflet-container { background: ${bg} !important; }
    .leaflet-tile { filter: ${tileFilter}; }
    .leaflet-control-zoom a { background: ${ctrl} !important; color: #1A73E8 !important; border-color: ${ctrlBorder} !important; }
    .leaflet-control-zoom a:hover { background: ${mode === "dark" ? "#252838" : "#F0F0F0"} !important; }
    .leaflet-control-attribution { background: ${attrBg} !important; color: ${attrColor} !important; font-size: 9px; }
    .leaflet-control-attribution a { color: ${mode === "dark" ? "#6B7280" : "#888888"} !important; }
    .leaflet-tooltip-dark { background: ${mode === "dark" ? "#1E2130" : "#FFFFFF"} !important; border: 1px solid ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} !important; color: ${mode === "dark" ? "#E8EAED" : "#1C1C1E"} !important; font-size: 11px; border-radius: 6px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important; }
    .train-marker-wrapper { display: flex; align-items: center; justify-content: center; }
    @keyframes trainPulse {
      0% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(1); opacity: 0.5; }
    }
    .train-pulse { position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(26,115,232,0.4); animation: trainPulse 2s ease-out infinite; }
    .train-dot { position: relative; z-index: 1; width: 13px; height: 13px; border-radius: 50%; background: #1A73E8; border: 2.5px solid #fff; box-shadow: 0 0 10px rgba(26,115,232,0.7); }
  `;
}

function injectLeafletCSS() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }
  if (!document.getElementById("leaflet-custom-css")) {
    const style = document.createElement("style");
    style.id = "leaflet-custom-css";
    document.head.appendChild(style);
  }
}

function updateMapCSS(mode: "dark" | "light") {
  if (typeof document === "undefined") return;
  const el = document.getElementById("leaflet-custom-css");
  if (el) el.textContent = buildMapCss(mode);
}

export function TrainMap() {
  const { mode } = useTheme();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const trainMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const dimPolyRef = useRef<any>(null);
  const activePolyRef = useRef<any>(null);
  const passedPolyRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const stationMarkersRef = useRef<any[]>([]);
  const initializedRef = useRef(false);

  const {
    trainPosition,
    userLocation,
    boardingStation,
    destinationStation,
    isJourneyActive,
  } = useNavizban();

  const fromIdx = IZBAN_STATIONS.findIndex(s => s.id === boardingStation.id);
  const toIdx = IZBAN_STATIONS.findIndex(s => s.id === destinationStation.id);
  const routeLatLngs = IZBAN_ROUTE_COORDS.map(c => [c.latitude, c.longitude]);

  function getSegmentCoords(startStationIdx: number, endStationIdx: number) {
    const startRouteIdx = findNearestRouteIndex(IZBAN_STATIONS[startStationIdx].latitude, IZBAN_STATIONS[startStationIdx].longitude);
    const endRouteIdx = findNearestRouteIndex(IZBAN_STATIONS[endStationIdx].latitude, IZBAN_STATIONS[endStationIdx].longitude);
    const low = Math.min(startRouteIdx, endRouteIdx);
    const high = Math.max(startRouteIdx, endRouteIdx);
    return IZBAN_ROUTE_COORDS.slice(low, high + 1).map(c => [c.latitude, c.longitude]);
  }

  function getTrainProgressCoords(
    fromStIdx: number,
    toStIdx: number,
    trainLat: number,
    trainLon: number,
    side: "passed" | "remaining"
  ) {
    const stFrom = IZBAN_STATIONS[fromStIdx];
    const stTo = IZBAN_STATIONS[toStIdx];
    const fromRI = findNearestRouteIndex(stFrom.latitude, stFrom.longitude);
    const toRI = findNearestRouteIndex(stTo.latitude, stTo.longitude);
    const trainRI = findNearestRouteIndex(trainLat, trainLon);

    const low = Math.min(fromRI, toRI);
    const high = Math.max(fromRI, toRI);
    const trainClamped = Math.max(low, Math.min(trainRI, high));

    const goingTowardLow = fromRI > toRI;

    if (side === "passed") {
      return goingTowardLow
        ? IZBAN_ROUTE_COORDS.slice(trainClamped, high + 1).map(c => [c.latitude, c.longitude])
        : IZBAN_ROUTE_COORDS.slice(low, trainClamped + 1).map(c => [c.latitude, c.longitude]);
    } else {
      return goingTowardLow
        ? IZBAN_ROUTE_COORDS.slice(low, trainClamped + 1).map(c => [c.latitude, c.longitude])
        : IZBAN_ROUTE_COORDS.slice(trainClamped, high + 1).map(c => [c.latitude, c.longitude]);
    }
  }

  useEffect(() => {
    injectLeafletCSS();
    updateMapCSS(mode);

    const isDark = mode === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttr = isDark
      ? '© <a href="https://carto.com/">CARTO</a>'
      : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const tileSubdomains = isDark ? "abcd" : "abc";

    const initMap = () => {
      const L = window.L;
      if (!L || !mapContainerRef.current || initializedRef.current) return;
      initializedRef.current = true;

      const map = L.map(mapContainerRef.current, { zoomControl: true, attributionControl: true })
        .setView([38.46, 27.12], 10);

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 19,
        subdomains: tileSubdomains,
      }).addTo(map);

      mapRef.current = map;

      dimPolyRef.current = L.polyline(routeLatLngs, {
        color: "rgba(255,255,255,0.14)", weight: 2.5, smoothFactor: 1,
      }).addTo(map);

      const segCoords = fromIdx !== -1 && toIdx !== -1
        ? getSegmentCoords(Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx))
        : routeLatLngs;

      activePolyRef.current = L.polyline(segCoords, {
        color: "#1A73E8", weight: 3.5, opacity: 0.9, smoothFactor: 1,
      }).addTo(map);

      passedPolyRef.current = L.polyline([], {
        color: "rgba(255,255,255,0.32)", weight: 3, smoothFactor: 1,
      }).addTo(map);

      IZBAN_STATIONS.forEach((station, idx) => {
        const isBoarding = station.id === boardingStation.id;
        const isDest = station.id === destinationStation.id;
        const minI = Math.min(fromIdx, toIdx);
        const maxI = Math.max(fromIdx, toIdx);
        const isOnRoute = idx >= minI && idx <= maxI;

        let color = "rgba(255,255,255,0.2)";
        let radius = 3.5;
        let weight = 1;
        if (isBoarding) { color = "#34A853"; radius = 7; weight = 2; }
        else if (isDest) { color = "#1A73E8"; radius = 7; weight = 2; }
        else if (isOnRoute) { color = "rgba(26,115,232,0.5)"; radius = 4; }

        const marker = L.circleMarker([station.latitude, station.longitude], {
          radius, color, weight, fillColor: color, fillOpacity: 0.85,
        }).addTo(map);
        marker.bindTooltip(station.name, { permanent: false, direction: "right", className: "leaflet-tooltip-dark" });
        stationMarkersRef.current.push({ marker, id: station.id });
      });

      const trainIcon = L.divIcon({
        className: "train-marker-wrapper",
        html: '<div class="train-pulse"></div><div class="train-dot"></div>',
        iconSize: [32, 32], iconAnchor: [16, 16],
      });
      const trainMarker = L.marker(
        [boardingStation.latitude, boardingStation.longitude],
        { icon: trainIcon, zIndexOffset: 1000 }
      ).addTo(map);
      trainMarkerRef.current = trainMarker;

      const bounds = L.latLngBounds(
        [boardingStation.latitude, boardingStation.longitude],
        [destinationStation.latitude, destinationStation.longitude]
      ).pad(0.3);
      map.fitBounds(bounds);
    };

    if (typeof window !== "undefined") {
      if (window.L) { initMap(); }
      else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
        trainMarkerRef.current = null;
        userCircleRef.current = null;
        dimPolyRef.current = null;
        activePolyRef.current = null;
        passedPolyRef.current = null;
        tileLayerRef.current = null;
        stationMarkersRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    updateMapCSS(mode);
    if (!mapRef.current || !window.L) return;
    const L = window.L;
    const isDark = mode === "dark";
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttr = isDark
      ? '© <a href="https://carto.com/">CARTO</a>'
      : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: tileAttr,
      maxZoom: 19,
      subdomains: isDark ? "abcd" : "abc",
    }).addTo(mapRef.current);
  }, [mode]);

  useEffect(() => {
    if (!mapRef.current || !trainMarkerRef.current) return;
    trainMarkerRef.current.setLatLng([trainPosition.latitude, trainPosition.longitude]);
    if (isJourneyActive) {
      mapRef.current.panTo([trainPosition.latitude, trainPosition.longitude], { animate: true, duration: 1.5 });
    }
  }, [trainPosition.latitude, trainPosition.longitude, isJourneyActive]);

  useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    if (!L) return;
    if (userCircleRef.current) { userCircleRef.current.remove(); userCircleRef.current = null; }
    if (userLocation) {
      userCircleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
        radius: 500, color: "#34A853", weight: 1.5, fillColor: "#34A853", fillOpacity: 0.07,
      }).addTo(mapRef.current);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  useEffect(() => {
    if (!mapRef.current) return;
    const L = window.L;
    if (!L || fromIdx === -1 || toIdx === -1) return;

    const minI = Math.min(fromIdx, toIdx);
    const maxI = Math.max(fromIdx, toIdx);

    if (!isJourneyActive) {
      const segCoords = getSegmentCoords(minI, maxI);
      if (activePolyRef.current) activePolyRef.current.setLatLngs(segCoords);
      if (passedPolyRef.current) passedPolyRef.current.setLatLngs([]);
    } else {
      const passedCoords = getTrainProgressCoords(fromIdx, toIdx, trainPosition.latitude, trainPosition.longitude, "passed");
      const remainCoords = getTrainProgressCoords(fromIdx, toIdx, trainPosition.latitude, trainPosition.longitude, "remaining");
      if (passedPolyRef.current) passedPolyRef.current.setLatLngs(passedCoords);
      if (activePolyRef.current) activePolyRef.current.setLatLngs(remainCoords);
    }

    stationMarkersRef.current.forEach(({ marker, id }) => {
      const idx = IZBAN_STATIONS.findIndex(s => s.id === id);
      const isBoarding = id === boardingStation.id;
      const isDest = id === destinationStation.id;
      const isOnRoute = idx >= minI && idx <= maxI;
      let color = "rgba(255,255,255,0.2)";
      let radius = 3.5;
      let weight = 1;
      if (isBoarding) { color = "#34A853"; radius = 7; weight = 2; }
      else if (isDest) { color = "#1A73E8"; radius = 7; weight = 2; }
      else if (isOnRoute) { color = "rgba(26,115,232,0.5)"; radius = 4; }
      marker.setStyle({ color, weight, fillColor: color, fillOpacity: 0.85 });
      marker.setRadius(radius);
    });

    if (!isJourneyActive) {
      const bounds = L.latLngBounds(
        [boardingStation.latitude, boardingStation.longitude],
        [destinationStation.latitude, destinationStation.longitude]
      ).pad(0.3);
      mapRef.current.fitBounds(bounds, { animate: true, duration: 1.0 });
    }
  }, [boardingStation.id, destinationStation.id, fromIdx, toIdx, isJourneyActive, trainPosition.latitude, trainPosition.longitude]);

  const bgColor = mode === "dark" ? "#0A0E1A" : "#E8ECF0";

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <div
        ref={mapContainerRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
