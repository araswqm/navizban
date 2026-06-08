import { NORTHBOUND_STATIONS } from "@workspace/navizban-core";

/** Rota koordinat dizisi (harita poliline için) */
export const ROUTE_COORDS: { latitude: number; longitude: number }[] =
  NORTHBOUND_STATIONS.map((s) => ({
    latitude: s.lat,
    longitude: s.lng,
  }));

/** İstasyon koordinatları */
export const STATION_COORDS = ROUTE_COORDS;
