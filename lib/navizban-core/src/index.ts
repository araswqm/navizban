// ============================================================
// Navizban Core — İZBAN istasyon verileri ve süre hesaplama
// ============================================================

/** İstasyon tanımı */
export interface Station {
  id: string;
  name: string;
  nameShort: string;
  lat: number;
  lng: number;
  /** Bir önceki istasyondan bu istasyona varış süresi (dk) */
  arrivalMinutes: number;
  /** Bu istasyonda bekleme süresi (dk) */
  waitMinutes: number;
}

/**
 * İZBAN Kuzey Hattı istasyonları (Aliağa → Menemen → ... → Alsancak)
 * Her istasyonun koordinatı, bir önceki duraktan geliş süresi ve bekleme süresi.
 */
export const NORTHBOUND_STATIONS: Station[] = [
  { id: "aliaga",        name: "Aliağa",        nameShort: "Aliağa",        lat: 38.7936, lng: 26.9753, arrivalMinutes: 0,  waitMinutes: 0 },
  { id: "biçerova",      name: "Biçerova",      nameShort: "Biçerova",      lat: 38.7811, lng: 26.9622, arrivalMinutes: 5,  waitMinutes: 1 },
  { id: "hatundere",     name: "Hatundere",     nameShort: "Hatundere",     lat: 38.7367, lng: 26.9736, arrivalMinutes: 15, waitMinutes: 1 },
  { id: "menemen",       name: "Menemen",       nameShort: "Menemen",       lat: 38.6019, lng: 27.0753, arrivalMinutes: 22, waitMinutes: 2 },
  { id: "emenler",       name: "Emenler",       nameShort: "Emenler",       lat: 38.5797, lng: 27.1261, arrivalMinutes: 27, waitMinutes: 1 },
  { id: "ayvacık",       name: "Ayvacık",       nameShort: "Ayvacık",       lat: 38.5550, lng: 27.1675, arrivalMinutes: 32, waitMinutes: 1 },
  { id: "çiğli",         name: "Çiğli",         nameShort: "Çiğli",         lat: 38.5264, lng: 27.0617, arrivalMinutes: 36, waitMinutes: 1 },
  { id: "egekent",       name: "Egekent",       nameShort: "Egekent",       lat: 38.5128, lng: 27.0728, arrivalMinutes: 38, waitMinutes: 1 },
  { id: "katipçelebi",   name: "Katip Çelebi",  nameShort: "K.Çelebi",     lat: 38.4972, lng: 27.0883, arrivalMinutes: 41, waitMinutes: 1 },
  { id: "karşıyaka",     name: "Karşıyaka",     nameShort: "Karşıyaka",     lat: 38.4622, lng: 27.1189, arrivalMinutes: 46, waitMinutes: 1 },
  { id: "bayraklı",      name: "Bayraklı",      nameShort: "Bayraklı",      lat: 38.4417, lng: 27.1550, arrivalMinutes: 51, waitMinutes: 1 },
  { id: "alsancak",      name: "Alsancak",      nameShort: "Alsancak",      lat: 38.4369, lng: 27.1553, arrivalMinutes: 57, waitMinutes: 0 },
];

/** Kuzey hattı istasyon isimleri */
export const NORTHBOUND_STATION_NAMES = NORTHBOUND_STATIONS.map(s => s.name);

/** Güney hattı (Alsancak → ... → Aliağa) — ters sıra */
export const SOUTHBOUND_STATIONS = [...NORTHBOUND_STATIONS].reverse();
export const SOUTHBOUND_STATION_NAMES = SOUTHBOUND_STATIONS.map(s => s.name);

/** Tüm istasyonlar (kuzey) */
export const ALL_STATIONS = NORTHBOUND_STATIONS;

/** İstasyona göre kümülatif süre (dk, 0 = Aliağa) */
export function getCumulativeMinutes(stationId: string): number {
  const st = NORTHBOUND_STATIONS.find(s => s.id === stationId);
  return st ? st.arrivalMinutes : 0;
}

/** İki istasyon arası süre (dk) */
export function travelMinutes(fromId: string, toId: string): number {
  const from = NORTHBOUND_STATIONS.find(s => s.id === fromId);
  const to = NORTHBOUND_STATIONS.find(s => s.id === toId);
  if (!from || !to) return 0;
  return Math.abs(to.arrivalMinutes - from.arrivalMinutes);
}

/** İstasyona en yakın istasyon id'sini döndür (mesafe km cinsinden) */
export function nearestStation(lat: number, lng: number): { station: Station; distanceKm: number } | null {
  if (!lat || !lng) return null;
  let best: Station | null = null;
  let bestDist = Infinity;
  for (const st of ALL_STATIONS) {
    const d = haversineKm(lat, lng, st.lat, st.lng);
    if (d < bestDist) {
      bestDist = d;
      best = st;
    }
  }
  return best ? { station: best, distanceKm: bestDist } : null;
}

/** Haversine mesafe formülü (km) */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** İki koordinat arası interpolasyon (0-1 arası t) */
export function interpolateCoords(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number
): { lat: number; lng: number } {
  return {
    lat: lat1 + (lat2 - lat1) * t,
    lng: lng1 + (lng2 - lng1) * t,
  };
}

/** Tren ilerleme indeksine göre harita koordinatı */
export interface TrainPosition {
  lat: number;
  lng: number;
  /** Şu anki istasyon indeksi (küsüratlı olabilir) */
  stationIndex: number;
  /** Varış istasyonuna kalan dakika */
  etaMinutes: number;
  /** Toplam yolculuk süresi */
  totalMinutes: number;
  /** Mevcut istasyon adı (eğer tam istasyondaysa) */
  currentStationId: string | null;
  /** Sonraki istasyon id */
  nextStationId: string | null;
  /** Yolculuk yüzdesi (0-100) */
  progressPercent: number;
}

/**
 * Tren pozisyonunu hesapla.
 * @param fromIndex biniş istasyonu indeksi (0-based)
 * @param toIndex varış istasyonu indeksi
 * @param elapsedMinutes yolculukta geçen dakika
 */
export function calculateTrainPosition(
  fromIndex: number,
  toIndex: number,
  elapsedMinutes: number
): TrainPosition {
  const direction = toIndex >= fromIndex ? 1 : -1;
  const stations = NORTHBOUND_STATIONS;
  const totalTripMinutes = travelMinutes(
    stations[fromIndex].id,
    stations[toIndex].id
  );

  if (totalTripMinutes <= 0) {
    // Aynı istasyon
    const st = stations[fromIndex];
    return {
      lat: st.lat,
      lng: st.lng,
      stationIndex: fromIndex,
      etaMinutes: 0,
      totalMinutes: 0,
      currentStationId: st.id,
      nextStationId: null,
      progressPercent: 100,
    };
  }

  const progress = Math.min(elapsedMinutes / totalTripMinutes, 1);
  const distanceInStations = Math.abs(toIndex - fromIndex);
  const currentRawIndex = fromIndex + direction * progress * distanceInStations;
  const currentIndex = Math.min(Math.max(currentRawIndex, 0), stations.length - 1);

  // Hangi iki istasyon arasında?
  const floorIdx = Math.floor(currentIndex);
  const ceilIdx = Math.ceil(currentIndex);
  const frac = currentIndex - floorIdx;

  const idxA = Math.min(Math.max(floorIdx, 0), stations.length - 1);
  const idxB = Math.min(Math.max(ceilIdx, 0), stations.length - 1);

  const stationA = stations[idxA];
  const stationB = stations[idxB];

  const coords = interpolateCoords(
    stationA.lat, stationA.lng,
    stationB.lat, stationB.lng,
    frac
  );

  const remaining = Math.max(0, totalTripMinutes - elapsedMinutes);

  return {
    lat: coords.lat,
    lng: coords.lng,
    stationIndex: currentIndex,
    etaMinutes: Math.round(remaining),
    totalMinutes: totalTripMinutes,
    currentStationId: frac < 0.1 ? stationA.id : null,
    nextStationId: idxB !== idxA ? stationB.id : null,
    progressPercent: Math.round(progress * 100),
  };
}
