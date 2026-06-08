import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
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

/**
 * Web harita bileşeni — Leaflet.js kullanır
 * Expo web için özel olarak hazırlanmıştır
 */
export function TrainMapWeb({
  trainPosition,
  userLatitude,
  userLongitude,
  fromIndex,
  toIndex,
}: Props) {
  const { isDark } = useTheme();
  const c = isDark ? Colors.dark : Colors.light;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [38.5, 27.1],
        zoom: 11,
        zoomControl: false,
      });

      L.tileLayer(
        isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }
      ).addTo(map);

      // Rota hattı
      const routeLatLngs = NORTHBOUND_STATIONS.map((s) => [s.lat, s.lng] as [number, number]);
      L.polyline(routeLatLngs, {
        color: c.primary,
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 10",
      }).addTo(map);

      // İstasyon markerları
      NORTHBOUND_STATIONS.forEach((st, idx) => {
        const color = idx === fromIndex ? "#3FB950" : idx === toIndex ? "#F85149" : "#58A6FF";
        L.circleMarker([st.lat, st.lng], {
          radius: 6,
          color: "#FFFFFF",
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<b>${st.name}</b><br/>${st.arrivalMinutes} dk`);
      });

      mapRef.current = map;
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isDark, fromIndex, toIndex]);

  // Tren imlecini güncelle
  useEffect(() => {
    if (!mapRef.current || !trainPosition || typeof window === "undefined") return;

    const L = require("leaflet");
    const map = mapRef.current;

    // Eski tren imlecini kaldır
    map.eachLayer((layer: any) => {
      if (layer._isTrainMarker) {
        map.removeLayer(layer);
      }
    });

    const trainIcon = L.divIcon({
      className: "train-marker",
      html: `<div style="
        width: 20px; height: 20px; background: ${c.accent};
        border: 3px solid #FFFFFF; border-radius: 50%;
        box-shadow: 0 0 8px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([trainPosition.lat, trainPosition.lng], {
      icon: trainIcon,
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup(
        `<b>🚆 ${fromIndex !== undefined ? NORTHBOUND_STATIONS[fromIndex]?.name : ""} → ${toIndex !== undefined ? NORTHBOUND_STATIONS[toIndex]?.name : ""}</b><br/>Kalan: ${trainPosition.etaMinutes} dk<br/>İlerleme: %${trainPosition.progressPercent}`
      );

    (marker as any)._isTrainMarker = true;

    // Haritayı trene ortala
    map.setView([trainPosition.lat, trainPosition.lng], map.getZoom(), {
      animate: true,
      duration: 1,
    });
  }, [trainPosition, c.accent, fromIndex, toIndex]);

  return (
    <View style={styles.container}>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
