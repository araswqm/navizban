import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  NORTHBOUND_STATIONS,
  nearestStation,
  calculateTrainPosition,
  travelMinutes,
} from "@workspace/navizban-core";
import type { TrainPosition } from "@workspace/navizban-core";

// ============================================================
// Sabitler
// ============================================================

const CONSENT_STORAGE_KEY = "navizban_consent_v1";
const API_BASE_URL = "https://api.navizban.xyz";
const HEARTBEAT_INTERVAL_MS = 15_000; // 15 saniye
const GPS_UPDATE_INTERVAL_MS = 60_000; // 1 dakika

// UUID kütüphanesi yerine basit bir fonksiyon
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// Tipler
// ============================================================

export interface LiveTrainInfo {
  trainId: string;
  fromStation: string;
  toStation: string;
  etaMinutes: number;
  direction: number;
  lastHeartbeat: number;
}

export interface NavizbanState {
  /** KVKK rızası verildi mi? */
  consentGiven: boolean;
  /** Rıza pop-up'ı gösterilsin mi? */
  showConsent: boolean;
  /** Son GPS konumu (enlem) */
  latitude: number | null;
  /** Son GPS konumu (boylam) */
  longitude: number | null;
  /** GPS hatası */
  locationError: string | null;
  /** Seçili biniş istasyonu indeksi */
  fromIndex: number;
  /** Seçili varış istasyonu indeksi */
  toIndex: number;
  /** Yolculuk başladı mı? */
  tripActive: boolean;
  /** Yolculukta geçen dakika */
  elapsedMinutes: number;
  /** Anonim yolculuk kimliği */
  anonymousTripId: string | null;
  /** Hesaplanan tren pozisyonu */
  trainPosition: TrainPosition | null;
  /** Biniş istasyonuna yaklaşan canlı trenler */
  liveTrains: LiveTrainInfo[];
  /** Canlı trenler yükleniyor mu? */
  loadingTrains: boolean;
  /** Navigasyon varsayılan istasyon indeksi (GPS bulunamazsa) */
  nearestStationIndex: number | null;
  /** Simülasyon modu (GPS yoksa) */
  simulationMode: boolean;
  /** Api bağlantı durumu */
  apiConnected: boolean;
}

// ============================================================
// Context
// ============================================================

interface NavizbanContextType extends NavizbanState {
  setConsent: (given: boolean) => Promise<void>;
  setFromIndex: (idx: number) => void;
  setToIndex: (idx: number) => void;
  startTrip: () => void;
  stopTrip: () => void;
  resetTrip: () => void;
  refreshLocation: () => Promise<void>;
  refreshLiveTrains: () => Promise<void>;
  apiBaseUrl: string;
}

const initialState: NavizbanState = {
  consentGiven: false,
  showConsent: false,
  latitude: null,
  longitude: null,
  locationError: null,
  fromIndex: 0,
  toIndex: 3,
  tripActive: false,
  elapsedMinutes: 0,
  anonymousTripId: null,
  trainPosition: null,
  liveTrains: [],
  loadingTrains: false,
  nearestStationIndex: null,
  simulationMode: false,
  apiConnected: false,
};

const NavizbanContext = createContext<NavizbanContextType>({
  ...initialState,
  setConsent: async () => {},
  setFromIndex: () => {},
  setToIndex: () => {},
  startTrip: () => {},
  stopTrip: () => {},
  resetTrip: () => {},
  refreshLocation: async () => {},
  refreshLiveTrains: async () => {},
  apiBaseUrl: API_BASE_URL,
});

// ============================================================
// Provider
// ============================================================

export function NavizbanProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavizbanState>(initialState);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gpsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>("active");

  // ==========================================================
  // Consent yönetimi
  // ==========================================================

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored === "true") {
          setState((prev) => ({ ...prev, consentGiven: true, showConsent: false }));
          // Rıza varsa konum almaya başla
          requestLocationPermission();
        } else {
          setState((prev) => ({ ...prev, showConsent: true }));
        }
      } catch {
        setState((prev) => ({ ...prev, showConsent: true }));
      }
    })();
  }, []);

  const setConsent = useCallback(async (given: boolean) => {
    try {
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, given ? "true" : "false");
      setState((prev) => ({ ...prev, consentGiven: given, showConsent: !given }));
      if (given) {
        requestLocationPermission();
      }
    } catch {
      // Storage hatası
    }
  }, []);

  // ==========================================================
  // Konum izni ve GPS
  // ==========================================================

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          locationError: "Konum izni verilmedi. Lütfen ayarlardan izin verin.",
        }));
        return;
      }
      await refreshLocation();
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        locationError: err?.message ?? "Konum alınamadı",
      }));
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10_000,
      });
      const { latitude, longitude } = loc.coords;
      const nearest = nearestStation(latitude, longitude);

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
        locationError: null,
        simulationMode: false,
        nearestStationIndex: nearest
          ? NORTHBOUND_STATIONS.findIndex((s) => s.id === nearest.station.id)
          : null,
      }));
    } catch (err: any) {
      // GPS alınamazsa simülasyon modu
      setState((prev) => ({
        ...prev,
        simulationMode: true,
        locationError: "GPS alınamadı, simülasyon modu aktif.",
      }));
    }
  }, []);

  // ==========================================================
  // İstasyon seçimi
  // ==========================================================

  const setFromIndex = useCallback((idx: number) => {
    setState((prev) => {
      // Varış aynı olmasın
      const toIdx = idx === prev.toIndex ? Math.min(idx + 1, NORTHBOUND_STATIONS.length - 1) : prev.toIndex;
      return { ...prev, fromIndex: idx, toIndex: toIdx };
    });
  }, []);

  const setToIndex = useCallback((idx: number) => {
    setState((prev) => {
      // Biniş aynı olmasın
      const fromIdx = idx === prev.fromIndex ? Math.max(idx - 1, 0) : prev.fromIndex;
      return { ...prev, fromIndex: fromIdx, toIndex: idx };
    });
  }, []);

  // ==========================================================
  // Yolculuk yönetimi
  // ==========================================================

  const startTrip = useCallback(() => {
    const tripId = generateId();
    setState((prev) => {
      const stations = NORTHBOUND_STATIONS;
      const from = stations[prev.fromIndex];
      const to = stations[prev.toIndex];
      const totalMin = travelMinutes(from.id, to.id);

      const pos = calculateTrainPosition(prev.fromIndex, prev.toIndex, 0);
      return {
        ...prev,
        tripActive: true,
        elapsedMinutes: 0,
        anonymousTripId: tripId,
        trainPosition: pos,
      };
    });
  }, []);

  const stopTrip = useCallback(() => {
    // Heartbeat'i durdur
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      tripActive: false,
      elapsedMinutes: 0,
      anonymousTripId: null,
    }));
  }, []);

  const resetTrip = useCallback(() => {
    stopTrip();
    setState((prev) => ({
      ...prev,
      fromIndex: prev.nearestStationIndex ?? 0,
      toIndex: 3,
      trainPosition: null,
      liveTrains: [],
    }));
  }, [stopTrip]);

  // ==========================================================
  // Yolculuk süresi sayacı
  // ==========================================================

  useEffect(() => {
    if (state.tripActive) {
      elapsedRef.current = setInterval(() => {
        setState((prev) => {
          const newElapsed = prev.elapsedMinutes + 1;
          const stations = NORTHBOUND_STATIONS;
          const totalMin = travelMinutes(stations[prev.fromIndex].id, stations[prev.toIndex].id);
          const pos = calculateTrainPosition(prev.fromIndex, prev.toIndex, newElapsed);

          // Yolculuk bitti mi?
          if (newElapsed >= totalMin) {
            if (heartbeatRef.current) {
              clearInterval(heartbeatRef.current);
              heartbeatRef.current = null;
            }
            if (elapsedRef.current) {
              clearInterval(elapsedRef.current);
              elapsedRef.current = null;
            }
            return {
              ...prev,
              elapsedMinutes: totalMin,
              trainPosition: { ...pos, etaMinutes: 0, progressPercent: 100 },
              tripActive: false,
            };
          }

          return {
            ...prev,
            elapsedMinutes: newElapsed,
            trainPosition: pos,
          };
        });
      }, 60_000); // Her dakika
    }
    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [state.tripActive, state.fromIndex, state.toIndex]);

  // ==========================================================
  // Anonim telemetri paylaşımı (heartbeat)
  // ==========================================================

  useEffect(() => {
    if (state.tripActive && state.consentGiven && state.anonymousTripId) {
      heartbeatRef.current = setInterval(async () => {
        try {
          const stations = NORTHBOUND_STATIONS;
          const from = stations[state.fromIndex];
          const to = stations[state.toIndex];
          const totalMin = travelMinutes(from.id, to.id);

          const body = {
            anonymousTripId: state.anonymousTripId,
            fromIndex: state.fromIndex,
            toIndex: state.toIndex,
            elapsedMinutes: state.elapsedMinutes,
            totalMinutes: totalMin,
            stationIndex: state.trainPosition?.stationIndex ?? state.fromIndex,
          };

          await fetch(`${API_BASE_URL}/api/trains/${state.anonymousTripId}/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).catch(() => {
            // Sessizce başarısız — offline modda devam
          });
        } catch {
          // Sessiz
        }
      }, HEARTBEAT_INTERVAL_MS);
    }
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [state.tripActive, state.consentGiven, state.anonymousTripId, state.elapsedMinutes, state.fromIndex, state.toIndex, state.trainPosition]);

  // ==========================================================
  // Canlı tren sorgulama
  // ==========================================================

  const refreshLiveTrains = useCallback(async () => {
    setState((prev) => ({ ...prev, loadingTrains: true }));
    try {
      const stationName = NORTHBOUND_STATIONS[state.fromIndex]?.name;
      if (!stationName) {
        setState((prev) => ({ ...prev, loadingTrains: false }));
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/trains?station=${encodeURIComponent(stationName)}`);
      const data = await res.json();
      if (data.trains) {
        setState((prev) => ({
          ...prev,
          liveTrains: data.trains,
          loadingTrains: false,
          apiConnected: true,
        }));
      } else {
        setState((prev) => ({ ...prev, loadingTrains: false }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loadingTrains: false,
        apiConnected: false,
      }));
    }
  }, [state.fromIndex]);

  // ==========================================================
  // AppState dinleme
  // ==========================================================

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // ==========================================================
  // Context değeri
  // ==========================================================

  const contextValue = useMemo<NavizbanContextType>(
    () => ({
      ...state,
      setConsent,
      setFromIndex,
      setToIndex,
      startTrip,
      stopTrip,
      resetTrip,
      refreshLocation,
      refreshLiveTrains,
      apiBaseUrl: API_BASE_URL,
    }),
    [
      state,
      setConsent,
      setFromIndex,
      setToIndex,
      startTrip,
      stopTrip,
      resetTrip,
      refreshLocation,
      refreshLiveTrains,
    ]
  );

  return (
    <NavizbanContext.Provider value={contextValue}>
      {children}
    </NavizbanContext.Provider>
  );
}

export function useNavizban() {
  return useContext(NavizbanContext);
}
