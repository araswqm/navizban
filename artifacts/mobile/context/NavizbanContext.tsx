import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import {
  IZBAN_STATIONS,
  Station,
  getNearestStation,
  getEstimatedMinutes,
  getInterpolatedPosition,
  getEffectiveStartMinutes,
  getPositionOnRoute,
  isNearRail,
  haversineKm,
  getRouteSegmentDistanceKm,
  getRemainingRouteDistanceKm,
  getDistanceProgressOnRoute,
  findNearestRouteIndex,
} from "@/constants/izban";
import { getApproachingTrains } from "@/services/izmirApi";

// expo-notifications web'de çalışmaz, stub kullan
const Notifications = Platform.OS === "web"
  ? {
      setNotificationHandler: () => {},
      requestPermissionsAsync: async () => ({ status: "denied" }),
      scheduleNotificationAsync: async () => "",
      dismissNotificationAsync: async () => {},
      dismissAllNotificationsAsync: async () => {},
    } as any
  : require("expo-notifications");

Notifications.setNotificationHandler?.({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type ProximityStatus = "ok" | "too_far" | "checking";
export type BoardingMode = "gps" | "manual";

interface TrainPosition {
  latitude: number;
  longitude: number;
}

interface NavizbanContextValue {
  userLocation: { latitude: number; longitude: number } | null;
  boardingStation: Station;
  destinationStation: Station;
  boardingMode: BoardingMode;
  setDestination: (station: Station) => void;
  setBoardingManual: (station: Station) => void;
  setBoardingGps: () => void;
  totalMinutes: number;
  remainingMinutes: number;
  elapsedSeconds: number;
  effectiveOffsetSeconds: number;
  speedKmh: number;
  trainPosition: TrainPosition;
  isJourneyActive: boolean;
  startJourney: () => void;
  stopJourney: () => void;
  locationPermission: "granted" | "denied" | "pending";
  isLoadingLocation: boolean;
  infoPanelVisible: boolean;
  toggleInfoPanel: () => void;
  progress: number;
  proximityStatus: ProximityStatus;
  // Yeni özellikler
  consentGiven: boolean;
  setConsent: (v: boolean) => void;
  liveTrains: LiveTrainInfo[];
  loadingTrains: boolean;
  refreshLiveTrains: () => void;
}

export interface LiveTrainInfo {
  trainId: string;
  fromStation: string;
  toStation: string;
  etaMinutes: number;
  direction: number;
  lastHeartbeat: number;
  /** Veri kaynağı: "gps" = gerçek yolcu konumu, "schedule" = İZBAN resmî tarifesi, "mock" = test verisi */
  source: "gps" | "schedule" | "mock";
}

const API_BASE_URL = "https://api.navizban.xyz";

const NavizbanContext = createContext<NavizbanContextValue | null>(null);

const DEFAULT_BOARDING_IDX = 19;
const DEFAULT_DEST_IDX = 0;
const LOCATION_TIMEOUT_MS = 8000;

async function getCoordinatesWithTimeout(): Promise<{ latitude: number; longitude: number }> {
  if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.geolocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err),
        { timeout: LOCATION_TIMEOUT_MS, maximumAge: 60000, enableHighAccuracy: false }
      );
    });
  }
  const loc = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), LOCATION_TIMEOUT_MS)
    ),
  ]);
  return { latitude: (loc as any).coords.latitude, longitude: (loc as any).coords.longitude };
}

// API erişilemediğinde gösterilecek mock tren verisi
function getMockTrains(stationName: string): LiveTrainInfo[] {
  const stationIdx = IZBAN_STATIONS.findIndex(s => s.name === stationName);
  if (stationIdx < 0) return [];
  const destIdx = (stationIdx + 8) % IZBAN_STATIONS.length;
  const now = Date.now();
  return [
    {
      trainId: `mock-${stationIdx}-1`,
      fromStation: stationName,
      toStation: IZBAN_STATIONS[destIdx].name,
      etaMinutes: 5 + (stationIdx % 7),
      direction: stationIdx < IZBAN_STATIONS.length / 2 ? 1 : -1,
      lastHeartbeat: now - 30000,
      source: "mock" as const,
    },
    {
      trainId: `mock-${stationIdx}-2`,
      fromStation: IZBAN_STATIONS[Math.max(0, stationIdx - 3)].name,
      toStation: stationName,
      etaMinutes: 12 + (stationIdx % 5),
      direction: stationIdx < IZBAN_STATIONS.length / 2 ? -1 : 1,
      lastHeartbeat: now - 60000,
      source: "mock" as const,
    },
  ];
}

export function NavizbanProvider({ children, consentGiven = false, setConsent }: { children: React.ReactNode; consentGiven?: boolean; setConsent?: (v: boolean) => void }) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [boardingStation, setBoardingStation] = useState<Station>(IZBAN_STATIONS[DEFAULT_BOARDING_IDX]);
  const [destinationStation, setDestinationStation] = useState<Station>(IZBAN_STATIONS[DEFAULT_DEST_IDX]);
  const [boardingMode, setBoardingModeState] = useState<BoardingMode>("gps");
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [effectiveOffsetSeconds, setEffectiveOffsetSeconds] = useState(0);
  const [trainPosition, setTrainPosition] = useState<TrainPosition>({
    latitude: IZBAN_STATIONS[DEFAULT_BOARDING_IDX].latitude,
    longitude: IZBAN_STATIONS[DEFAULT_BOARDING_IDX].longitude,
  });
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [infoPanelVisible, setInfoPanelVisible] = useState(true);
  const [proximityStatus, setProximityStatus] = useState<ProximityStatus>("checking");
  const [liveTrains, setLiveTrains] = useState<LiveTrainInfo[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(true); // Başlangıçta yükleme göster
  const [speedKmh, setSpeedKmh] = useState(0);

  const journeyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const journeyStartTimeRef = useRef<number>(0);
  const lastGpsMinuteRef = useRef<number>(0);
  const notifIdRef = useRef<string | null>(null);
  const boardingRef = useRef(boardingStation);
  const destRef = useRef(destinationStation);
  const totalMinutesRef = useRef(totalMinutes);
  const userLocationRef = useRef(userLocation);
  const boardingModeRef = useRef(boardingMode);
  const effectiveOffsetRef = useRef(effectiveOffsetSeconds);
  // GPS hız takibi için ref'ler
  const lastGpsPosRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastGpsTimeRef = useRef<number>(0);
  const cumulativeDistanceKmRef = useRef(0);
  const speedKmhRef = useRef(0);
  const totalRouteDistanceKmRef = useRef(0);
  const distanceProgressRef = useRef(0);

  useEffect(() => { boardingRef.current = boardingStation; }, [boardingStation]);
  useEffect(() => { destRef.current = destinationStation; }, [destinationStation]);
  useEffect(() => { totalMinutesRef.current = totalMinutes; }, [totalMinutes]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { boardingModeRef.current = boardingMode; }, [boardingMode]);
  useEffect(() => { effectiveOffsetRef.current = effectiveOffsetSeconds; }, [effectiveOffsetSeconds]);
  useEffect(() => { speedKmhRef.current = speedKmh; }, [speedKmh]);

  const applyGpsLocation = useCallback((coords: { latitude: number; longitude: number }, dest: Station) => {
    setUserLocation(coords);
    const nearest = getNearestStation(coords.latitude, coords.longitude);
    setBoardingStation(nearest);
    const routePos = getPositionOnRoute(coords.latitude, coords.longitude);
    setTrainPosition(routePos);
    const nearRail = isNearRail(coords.latitude, coords.longitude, 0.5);
    setProximityStatus(nearRail ? "ok" : "too_far");
    const offset = getEffectiveStartMinutes(coords.latitude, coords.longitude, nearest, dest);
    setEffectiveOffsetSeconds(offset * 60);
  }, []);

  const requestLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === "web") {
        setLocationPermission("granted");
        try {
          const coords = await getCoordinatesWithTimeout();
          applyGpsLocation(coords, destRef.current);
        } catch {
          setProximityStatus("ok");
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationPermission("granted");
          try {
            const coords = await getCoordinatesWithTimeout();
            applyGpsLocation(coords, destRef.current);
          } catch {
            setProximityStatus("ok");
          }
        } else {
          setLocationPermission("denied");
          setProximityStatus("too_far");
        }
      }
    } catch {
      setLocationPermission("denied");
      setProximityStatus("too_far");
    } finally {
      setIsLoadingLocation(false);
    }
  }, [applyGpsLocation]);

  const requestNotificationPermission = useCallback(async () => {
    try { await Notifications.requestPermissionsAsync(); } catch {}
  }, []);

  useEffect(() => {
    requestLocation();
    requestNotificationPermission();
  }, [requestLocation, requestNotificationPermission]);

  useEffect(() => {
    const mins = getEstimatedMinutes(boardingStation, destinationStation);
    setTotalMinutes(mins);
    if (!isJourneyActive) {
      setElapsedSeconds(0);
      if (boardingMode === "gps" && userLocation) {
        const routePos = getPositionOnRoute(userLocation.latitude, userLocation.longitude);
        setTrainPosition(routePos);
        const offset = getEffectiveStartMinutes(userLocation.latitude, userLocation.longitude, boardingStation, destinationStation);
        setEffectiveOffsetSeconds(offset * 60);
      } else {
        setTrainPosition({ latitude: boardingStation.latitude, longitude: boardingStation.longitude });
        setEffectiveOffsetSeconds(0);
      }
    }
  }, [boardingStation.id, destinationStation.id]);

  const scheduleJourneyNotification = useCallback(async (remainMins: number, prog: number) => {
    try {
      if (notifIdRef.current) {
        await Notifications.dismissNotificationAsync(notifIdRef.current);
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚂 ${boardingRef.current.name} → ${destRef.current.name}`,
          body: `${Math.ceil(remainMins)} dk kalan · %${Math.round(prog * 100)} tamamlandı`,
          data: { type: "journey" },
        },
        trigger: null,
      } as any);
      notifIdRef.current = id;
    } catch {}
  }, []);

  const cancelJourneyNotification = useCallback(async () => {
    try {
      if (notifIdRef.current) {
        await Notifications.dismissNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      }
      await Notifications.dismissAllNotificationsAsync();
    } catch {}
  }, []);

  const stopJourney = useCallback(() => {
    setIsJourneyActive(false);
    if (journeyTimerRef.current) {
      clearTimeout(journeyTimerRef.current);
      journeyTimerRef.current = null;
    }
    setSpeedKmh(0);
    speedKmhRef.current = 0;
    distanceProgressRef.current = 0;
    cumulativeDistanceKmRef.current = 0;
    lastGpsPosRef.current = null;
    lastGpsTimeRef.current = 0;
    cancelJourneyNotification();
  }, [cancelJourneyNotification]);

  const startJourney = useCallback(async () => {
    if (boardingStation.id === destinationStation.id) return;
    if (boardingMode === "manual") return;
    if (proximityStatus === "too_far") return;
    const total = getEstimatedMinutes(boardingStation, destinationStation);
    if (total <= 0) return;

    // Rota toplam mesafesini hesapla
    const boardingRouteIdx = findNearestRouteIndex(boardingStation.latitude, boardingStation.longitude);
    const destRouteIdx = findNearestRouteIndex(destinationStation.latitude, destinationStation.longitude);
    const totalDist = getRouteSegmentDistanceKm(boardingRouteIdx, destRouteIdx);
    totalRouteDistanceKmRef.current = totalDist;

    // Mevcut GPS konumuna göre başlangıç mesafesini ayarla
    let initialDistance = 0;
    try {
      const coords = await getCoordinatesWithTimeout();
      setUserLocation(coords);
      lastGpsPosRef.current = coords;
      lastGpsTimeRef.current = Date.now();

      // Kullanıcının boarding'e göre ne kadar ilerlediğini hesapla
      const currentProgress = getDistanceProgressOnRoute(
        coords.latitude, coords.longitude,
        boardingStation, destinationStation
      );
      initialDistance = currentProgress * totalDist;
      cumulativeDistanceKmRef.current = initialDistance;
      distanceProgressRef.current = currentProgress;

      // Başlangıç pozisyonunu rotaya oturt
      const routePos = getPositionOnRoute(coords.latitude, coords.longitude);
      setTrainPosition(routePos);

      const nearRail = isNearRail(coords.latitude, coords.longitude, 0.5);
      setProximityStatus(nearRail ? "ok" : "too_far");
    } catch {
      // GPS alınamazsa boarding istasyonundan başlat
      cumulativeDistanceKmRef.current = 0;
      distanceProgressRef.current = 0;
      lastGpsPosRef.current = null;
      lastGpsTimeRef.current = Date.now();
      setTrainPosition({ latitude: boardingStation.latitude, longitude: boardingStation.longitude });
    }

    // Başlangıç hızı 0
    setSpeedKmh(0);
    speedKmhRef.current = 0;

    const startOffset = effectiveOffsetRef.current;
    setElapsedSeconds(startOffset);
    journeyStartTimeRef.current = Date.now();
    lastGpsMinuteRef.current = Math.floor(startOffset / 60);
    setIsJourneyActive(true);
    scheduleJourneyNotification(total - startOffset / 60, startOffset / (total * 60));
  }, [boardingStation, destinationStation, boardingMode, proximityStatus, scheduleJourneyNotification]);

  // Yolculuk timer'ı: Her saniye GPS konumu al, hız hesapla, mesafeye göre ilerle
  useEffect(() => {
    if (!isJourneyActive) return;

    let active = true;
    let lastNotifMinute = 0;

    const tick = async () => {
      if (!active) return;
      const totalDist = totalRouteDistanceKmRef.current;

      try {
        const coords = await getCoordinatesWithTimeout();
        if (!active) return;

        setUserLocation(coords);

        // Hız hesapla (km/saat)
        let newSpeedKmh = speedKmhRef.current;
        if (lastGpsPosRef.current && lastGpsTimeRef.current > 0) {
          const timeDeltaSec = (Date.now() - lastGpsTimeRef.current) / 1000;
          if (timeDeltaSec > 0.5) {
            const distKm = haversineKm(
              lastGpsPosRef.current.latitude, lastGpsPosRef.current.longitude,
              coords.latitude, coords.longitude
            );
            // Anlık hız (km/saat), maksimum 160 km/s ile sınırla (İZBAN max hızı ~140)
            const rawSpeed = (distKm / timeDeltaSec) * 3600;
            // Hız smoothing: %70 yeni, %30 eski
            newSpeedKmh = rawSpeed > 160 ? 160 : rawSpeed;
            newSpeedKmh = newSpeedKmh * 0.7 + speedKmhRef.current * 0.3;
          }
        }

        speedKmhRef.current = newSpeedKmh;
        setSpeedKmh(newSpeedKmh);

        // GPS konumunu rotaya oturt
        const routePos = getPositionOnRoute(coords.latitude, coords.longitude);
        setTrainPosition(routePos);

        // Mesafe bazlı ilerleme oranını hesapla
        const distProgress = getDistanceProgressOnRoute(
          coords.latitude, coords.longitude,
          boardingRef.current, destRef.current
        );
        distanceProgressRef.current = distProgress;

        // Katedilen mesafeyi güncelle
        cumulativeDistanceKmRef.current = distProgress * totalDist;

        // Kalan süre: kalan mesafe / hız
        const remainingDist = totalDist > 0 ? Math.max(totalDist - cumulativeDistanceKmRef.current, 0) : 0;
        const speedForEta = newSpeedKmh > 1 ? newSpeedKmh : 40; // Duruyorsa varsayılan İZBAN hızıyla göster
        const remainingMins = (remainingDist / speedForEta) * 60;
        setElapsedSeconds((distProgress * totalMinutesRef.current) * 60);

        // Bildirim (dakikada bir)
        const currentMinute = Math.floor(Date.now() / 60000);
        if (currentMinute > lastNotifMinute) {
          lastNotifMinute = currentMinute;
          scheduleJourneyNotification(remainingMins, distProgress);
        }

        // GPS geçmişini güncelle
        lastGpsPosRef.current = coords;
        lastGpsTimeRef.current = Date.now();

        // Varış kontrolü (mesafe bazlı)
        if (distProgress >= 0.995) {
          setTrainPosition({ latitude: destRef.current.latitude, longitude: destRef.current.longitude });
          setSpeedKmh(0);
          speedKmhRef.current = 0;
          setIsJourneyActive(false);
          cancelJourneyNotification();
          active = false;
        }
      } catch {
        // GPS alınamazsa son hızı koru, pozisyonu güncelleme
      }

      if (active) {
        journeyTimerRef.current = setTimeout(tick, 1000);
      }
    };

    // İlk tick'i hemen başlat
    journeyTimerRef.current = setTimeout(tick, 1000);

    return () => {
      active = false;
      if (journeyTimerRef.current) {
        clearTimeout(journeyTimerRef.current);
        journeyTimerRef.current = null;
      }
    };
  }, [isJourneyActive, scheduleJourneyNotification, cancelJourneyNotification]);

  useEffect(() => {
    if (locationPermission !== "granted") return;

    locationTimerRef.current = setInterval(async () => {
      try {
        const coords = await getCoordinatesWithTimeout();
        setUserLocation(coords);
        if (!isJourneyActive && boardingModeRef.current === "gps") {
          const nearest = getNearestStation(coords.latitude, coords.longitude);
          setBoardingStation(nearest);
          const routePos = getPositionOnRoute(coords.latitude, coords.longitude);
          setTrainPosition(routePos);
          const nearRail = isNearRail(coords.latitude, coords.longitude, 0.5);
          setProximityStatus(nearRail ? "ok" : "too_far");
          const offset = getEffectiveStartMinutes(coords.latitude, coords.longitude, nearest, destRef.current);
          setEffectiveOffsetSeconds(offset * 60);
        }
      } catch {}
    }, 60000);

    return () => {
      if (locationTimerRef.current) clearInterval(locationTimerRef.current);
    };
  }, [locationPermission, isJourneyActive]);

  const setDestination = useCallback((station: Station) => {
    setDestinationStation(station);
    stopJourney();
    setElapsedSeconds(0);
  }, [stopJourney]);

  const setBoardingManual = useCallback((station: Station) => {
    setBoardingModeState("manual");
    setBoardingStation(station);
    setTrainPosition({ latitude: station.latitude, longitude: station.longitude });
    setEffectiveOffsetSeconds(0);
    setElapsedSeconds(0);
    stopJourney();
  }, [stopJourney]);

  const setBoardingGps = useCallback(() => {
    setBoardingModeState("gps");
    const loc = userLocationRef.current;
    if (loc) {
      const nearest = getNearestStation(loc.latitude, loc.longitude);
      setBoardingStation(nearest);
      const routePos = getPositionOnRoute(loc.latitude, loc.longitude);
      setTrainPosition(routePos);
      const offset = getEffectiveStartMinutes(loc.latitude, loc.longitude, nearest, destRef.current);
      setEffectiveOffsetSeconds(offset * 60);
    }
    setElapsedSeconds(0);
    stopJourney();
  }, [stopJourney]);

  const toggleInfoPanel = useCallback(() => {
    setInfoPanelVisible(prev => !prev);
  }, []);

  const elapsedMinutes = elapsedSeconds / 60;
  
  // Kalan süre: Yolculuk aktifse hız ve kalan mesafeye göre, değilse istasyonlar arası sabit süre
  const remainingMinutes = (() => {
    if (isJourneyActive) {
      const totalDist = totalRouteDistanceKmRef.current;
      const remainingDist = totalDist > 0 ? Math.max(totalDist - cumulativeDistanceKmRef.current, 0) : 0;
      const spd = speedKmh > 1 ? speedKmh : 40; // Duruyorsa ~40 km/s varsayılan
      return (remainingDist / spd) * 60;
    }
    return Math.max(totalMinutes - effectiveOffsetSeconds / 60, 0);
  })();

  // İlerleme: Mesafe bazlı (yolculuk aktifse GPS mesafesi, değilse offset)
  const progress = (() => {
    if (isJourneyActive) {
      return distanceProgressRef.current;
    }
    if (totalMinutes > 0) {
      return Math.min(effectiveOffsetSeconds / (totalMinutes * 60), 1);
    }
    return 0;
  })();

  const refreshLiveTrains = useCallback(async () => {
    setLoadingTrains(true);
    try {
      // 1. Önce gerçek zamanlı Navizban API'sini dene
      const res = await fetch(`${API_BASE_URL}/api/trains?station=${encodeURIComponent(boardingStation.name)}`);
      const data = await res.json();
      if (data.trains && data.trains.length > 0) {
        // Gerçek yolcu GPS verisi mevcut → source: "gps" olarak işaretle
        const gpsTrains = data.trains.map((t: any) => ({ ...t, source: "gps" as const }));
        setLiveTrains(gpsTrains);
        setLoadingTrains(false);
        return;
      }
    } catch {
      // Navizban API erişilemez → devam et
    }

    try {
      // 2. İzmir Büyükşehir API'sinden resmî sefer tarifesini sorgula
      const scheduleTrains = await getApproachingTrains(boardingStation.id, undefined, 4);
      if (scheduleTrains.length > 0) {
        const mapped: LiveTrainInfo[] = scheduleTrains.map(st => ({
          trainId: st.trainId,
          fromStation: st.fromStationName,
          toStation: st.toStationName,
          etaMinutes: st.etaMinutes,
          direction: 0, // Tarifeden yön bilgisi alınamaz
          lastHeartbeat: Date.now(),
          source: "schedule" as const,
        }));
        setLiveTrains(mapped);
        setLoadingTrains(false);
        return;
      }
    } catch {
      // İzmir API de erişilemez → mock veriye geç
    }

    // 3. Hiçbir API çalışmazsa mock veri göster
    setLiveTrains(getMockTrains(boardingStation.name));
    setLoadingTrains(false);
  }, [boardingStation.name]);

  // Biniş istasyonu değişince canlı trenleri otomatik sorgula
  useEffect(() => {
    refreshLiveTrains();
  }, [boardingStation.name]);

  // Her 60 saniyede bir canlı trenleri yenile
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLiveTrains();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshLiveTrains]);

  const value = useMemo<NavizbanContextValue>(() => ({
    userLocation,
    boardingStation,
    destinationStation,
    boardingMode,
    setDestination,
    setBoardingManual,
    setBoardingGps,
    totalMinutes,
    remainingMinutes,
    elapsedSeconds,
    effectiveOffsetSeconds,
    speedKmh,
    trainPosition,
    isJourneyActive,
    startJourney,
    stopJourney,
    locationPermission,
    isLoadingLocation,
    infoPanelVisible,
    toggleInfoPanel,
    progress,
    proximityStatus,
    consentGiven,
    setConsent: setConsent ?? (() => {}),
    liveTrains,
    loadingTrains,
    refreshLiveTrains,
  }), [
    userLocation, boardingStation, destinationStation, boardingMode,
    setDestination, setBoardingManual, setBoardingGps,
    totalMinutes, remainingMinutes, elapsedSeconds, effectiveOffsetSeconds, speedKmh,
    trainPosition, isJourneyActive, startJourney, stopJourney,
    locationPermission, isLoadingLocation, infoPanelVisible, toggleInfoPanel,
    progress, proximityStatus,
    consentGiven, setConsent, liveTrains, loadingTrains, refreshLiveTrains,
  ]);

  return (
    <NavizbanContext.Provider value={value}>
      {children}
    </NavizbanContext.Provider>
  );
}

export function useNavizban() {
  const ctx = useContext(NavizbanContext);
  if (!ctx) throw new Error("useNavizban must be inside NavizbanProvider");
  return ctx;
}
