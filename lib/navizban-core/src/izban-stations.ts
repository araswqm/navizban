import { IZBAN_ROUTE_COORDS } from "./route";

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timeToNext: number;
}

export const IZBAN_STATIONS: Station[] = [
  { id: "aliaga", name: "Aliağa", latitude: 38.7889, longitude: 26.9669, timeToNext: 4 },
  { id: "bicerova", name: "Biçerova", latitude: 38.7497, longitude: 26.9603, timeToNext: 8 },
  { id: "hatundere", name: "Hatundere", latitude: 38.69, longitude: 27.0175, timeToNext: 8 },
  { id: "menemen", name: "Menemen", latitude: 38.6033, longitude: 27.0767, timeToNext: 5 },
  { id: "egekent2", name: "Egekent 2", latitude: 38.5606, longitude: 27.0444, timeToNext: 3 },
  { id: "ulukent", name: "Ulukent", latitude: 38.5486, longitude: 27.0361, timeToNext: 4 },
  { id: "egekent", name: "Egekent", latitude: 38.5072, longitude: 27.0461, timeToNext: 2 },
  { id: "atasanayi", name: "Atasanayi", latitude: 38.4989, longitude: 27.0533, timeToNext: 3 },
  { id: "cigli", name: "Çiğli", latitude: 38.4919, longitude: 27.0631, timeToNext: 3 },
  { id: "mavisehir", name: "Mavişehir", latitude: 38.4806, longitude: 27.0844, timeToNext: 2 },
  { id: "semikler", name: "Şemikler", latitude: 38.4742, longitude: 27.0906, timeToNext: 2 },
  { id: "demirkopru", name: "Demirköprü", latitude: 38.4678, longitude: 27.0967, timeToNext: 2 },
  { id: "nergiz", name: "Nergiz", latitude: 38.4592, longitude: 27.1053, timeToNext: 2 },
  { id: "karsiyaka", name: "Karşıyaka", latitude: 38.4578, longitude: 27.1144, timeToNext: 1 },
  { id: "alaybey", name: "Alaybey", latitude: 38.4608, longitude: 27.1217, timeToNext: 1 },
  { id: "naldoken", name: "Naldöken", latitude: 38.4647, longitude: 27.1283, timeToNext: 2 },
  { id: "turan", name: "Turan", latitude: 38.4669, longitude: 27.1497, timeToNext: 2 },
  { id: "bayrakli", name: "Bayraklı", latitude: 38.4639, longitude: 27.1644, timeToNext: 2 },
  { id: "salhane", name: "Salhane", latitude: 38.4508, longitude: 27.1722, timeToNext: 3 },
  { id: "halkapinar", name: "Halkapınar", latitude: 38.4348, longitude: 27.1686, timeToNext: 9 },
  { id: "alsancak", name: "Alsancak", latitude: 38.4395, longitude: 27.1479, timeToNext: 4 },
  { id: "hilal", name: "Hilal", latitude: 38.4255, longitude: 27.1544, timeToNext: 2 },
  { id: "kemer", name: "Kemer", latitude: 38.4222, longitude: 27.1558, timeToNext: 5 },
  { id: "sirinyer", name: "Şirinyer", latitude: 38.3933, longitude: 27.1469, timeToNext: 2 },
  { id: "kosu", name: "Koşu", latitude: 38.3842, longitude: 27.1475, timeToNext: 2 },
  { id: "inkılap", name: "İnkılap", latitude: 38.3689, longitude: 27.1417, timeToNext: 2 },
  { id: "semtgaraji", name: "Semt Garajı", latitude: 38.3569, longitude: 27.1367, timeToNext: 2 },
  { id: "esbas", name: "Esbaş", latitude: 38.3361, longitude: 27.1367, timeToNext: 2 },
  { id: "gaziemir", name: "Gaziemir", latitude: 38.3264, longitude: 27.14, timeToNext: 2 },
  { id: "sarnic", name: "Sarnıç", latitude: 38.3119, longitude: 27.1447, timeToNext: 3 },
  { id: "adnanmenderes", name: "Adnan Menderes Havalimanı", latitude: 38.2911, longitude: 27.1481, timeToNext: 4 },
  { id: "cumaovasi", name: "Cumaovası", latitude: 38.2625, longitude: 27.1631, timeToNext: 7 },
  { id: "develi", name: "Develi", latitude: 38.2031, longitude: 27.1681, timeToNext: 3 },
  { id: "tekeli", name: "Tekeli", latitude: 38.1811, longitude: 27.1856, timeToNext: 5 },
  { id: "pancar", name: "Pancar", latitude: 38.1975, longitude: 27.2397, timeToNext: 5 },
  { id: "kuscuburun", name: "Kuşçuburun", latitude: 38.2094, longitude: 27.3089, timeToNext: 6 },
  { id: "torbali", name: "Torbalı", latitude: 38.1697, longitude: 27.3472, timeToNext: 3 },
  { id: "tepekoy", name: "Tepeköy", latitude: 38.1472, longitude: 27.3613, timeToNext: 7 },
  { id: "saglik", name: "Sağlık", latitude: 38.0846, longitude: 27.4008, timeToNext: 6 },
  { id: "belevi", name: "Belevi", latitude: 38.0306, longitude: 27.4331, timeToNext: 10 },
  { id: "selcuk", name: "Selçuk", latitude: 37.9509, longitude: 27.3731, timeToNext: 0 },
];

export function getEstimatedMinutes(from: Station, to: Station): number {
  if (from.id === to.id) return 0;
  const fromIdx = IZBAN_STATIONS.findIndex(s => s.id === from.id);
  const toIdx = IZBAN_STATIONS.findIndex(s => s.id === to.id);
  if (fromIdx === -1 || toIdx === -1) return 0;
  const minIdx = Math.min(fromIdx, toIdx);
  const maxIdx = Math.max(fromIdx, toIdx);
  let total = 0;
  for (let i = minIdx; i < maxIdx; i++) {
    total += IZBAN_STATIONS[i].timeToNext;
  }
  return total;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestStation(lat: number, lon: number): Station {
  let nearest = IZBAN_STATIONS[0];
  let minDist = Infinity;
  for (const station of IZBAN_STATIONS) {
    const d = haversineKm(lat, lon, station.latitude, station.longitude);
    if (d < minDist) {
      minDist = d;
      nearest = station;
    }
  }
  return nearest;
}

export function isNearRail(lat: number, lon: number, thresholdKm = 0.5): boolean {
  for (let i = 0; i < IZBAN_ROUTE_COORDS.length; i += 4) {
    const pt = IZBAN_ROUTE_COORDS[i];
    const d = haversineKm(lat, lon, pt.latitude, pt.longitude);
    if (d <= thresholdKm) return true;
  }
  return false;
}

export function findNearestRouteIndex(lat: number, lon: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < IZBAN_ROUTE_COORDS.length; i++) {
    const pt = IZBAN_ROUTE_COORDS[i];
    const d = haversineKm(lat, lon, pt.latitude, pt.longitude);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

let _stationRouteIndices: number[] | null = null;
function getStationRouteIndices(): number[] {
  if (_stationRouteIndices) return _stationRouteIndices;
  _stationRouteIndices = IZBAN_STATIONS.map(s =>
    findNearestRouteIndex(s.latitude, s.longitude)
  );
  return _stationRouteIndices;
}

export function getEffectiveStartMinutes(
  userLat: number,
  userLon: number,
  boardingStation: Station,
  destinationStation: Station
): number {
  const boardingIdx = IZBAN_STATIONS.findIndex(s => s.id === boardingStation.id);
  const destIdx = IZBAN_STATIONS.findIndex(s => s.id === destinationStation.id);
  if (boardingIdx === -1 || destIdx === -1 || boardingIdx === destIdx) return 0;

  const stRouteIndices = getStationRouteIndices();
  const boardingRouteIdx = stRouteIndices[boardingIdx];
  const destRouteIdx = stRouteIndices[destIdx];
  const userRouteIdx = findNearestRouteIndex(userLat, userLon);

  const routeMin = Math.min(boardingRouteIdx, destRouteIdx);
  const routeMax = Math.max(boardingRouteIdx, destRouteIdx);

  if (userRouteIdx < routeMin || userRouteIdx > routeMax) return 0;

  const stMin = Math.min(boardingIdx, destIdx);
  const stMax = Math.max(boardingIdx, destIdx);

  const goingNorth = boardingIdx > destIdx;

  let elapsed = 0;
  for (let i = stMin; i < stMax; i++) {
    const segStart = stRouteIndices[i];
    const segEnd = stRouteIndices[i + 1];
    const segMin = Math.min(segStart, segEnd);
    const segMax = Math.max(segStart, segEnd);

    if (userRouteIdx >= segMin && userRouteIdx <= segMax) {
      const segLen = segMax - segMin;
      if (segLen === 0) { elapsed += IZBAN_STATIONS[i].timeToNext; break; }
      const fraction = (userRouteIdx - segMin) / segLen;
      elapsed += fraction * IZBAN_STATIONS[i].timeToNext;
      break;
    } else if (userRouteIdx > segMax) {
      elapsed += IZBAN_STATIONS[i].timeToNext;
    } else {
      break;
    }
  }

  if (goingNorth) {
    const totalJourneyMinutes = getEstimatedMinutes(boardingStation, destinationStation);
    return Math.max(0, Math.min(totalJourneyMinutes - elapsed, totalJourneyMinutes));
  }
  return Math.max(0, elapsed);
}

export function getPositionOnRoute(userLat: number, userLon: number): { latitude: number; longitude: number } {
  const idx = findNearestRouteIndex(userLat, userLon);
  const pt = IZBAN_ROUTE_COORDS[idx];
  return { latitude: pt.latitude, longitude: pt.longitude };
}

export function getInterpolatedPosition(
  from: Station,
  to: Station,
  progressFraction: number
): { latitude: number; longitude: number } {
  const fromRouteIdx = findNearestRouteIndex(from.latitude, from.longitude);
  const toRouteIdx = findNearestRouteIndex(to.latitude, to.longitude);

  if (fromRouteIdx === toRouteIdx) {
    return { latitude: from.latitude, longitude: from.longitude };
  }

  const clampedProgress = Math.max(0, Math.min(1, progressFraction));
  const targetIdx = fromRouteIdx + (toRouteIdx - fromRouteIdx) * clampedProgress;

  const N = IZBAN_ROUTE_COORDS.length - 1;
  const lowerIdx = Math.max(0, Math.min(Math.floor(targetIdx), N));
  const upperIdx = Math.max(0, Math.min(Math.ceil(targetIdx), N));
  const frac = targetIdx - Math.floor(targetIdx);

  const lower = IZBAN_ROUTE_COORDS[lowerIdx];
  const upper = IZBAN_ROUTE_COORDS[upperIdx];

  if (!lower || !upper) return { latitude: from.latitude, longitude: from.longitude };

  return {
    latitude: lower.latitude + (upper.latitude - lower.latitude) * frac,
    longitude: lower.longitude + (upper.longitude - lower.longitude) * frac,
  };
}
