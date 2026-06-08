import {
  NORTHBOUND_STATIONS,
  NORTHBOUND_STATION_NAMES,
  ALL_STATIONS,
  calculateTrainPosition,
  nearestStation,
  haversineKm,
  interpolateCoords,
  travelMinutes,
  getCumulativeMinutes,
} from "@workspace/navizban-core";

export {
  NORTHBOUND_STATIONS,
  NORTHBOUND_STATION_NAMES,
  ALL_STATIONS,
  calculateTrainPosition,
  nearestStation,
  haversineKm,
  interpolateCoords,
  travelMinutes,
  getCumulativeMinutes,
};

/** Harita başlangıç bölgesi (İzmir) */
export const INITIAL_REGION = {
  latitude: 38.5,
  longitude: 27.1,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4,
};
