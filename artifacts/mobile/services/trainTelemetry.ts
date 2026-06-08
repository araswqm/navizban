/**
 * Navizban Train Telemetry Service
 *
 * API ile iletişim kuran servis katmanı.
 * Bağlantı yoksa sessizce offline modda çalışır.
 */

const API_BASE_URL = "https://api.navizban.xyz";

export interface HeartbeatPayload {
  anonymousTripId: string;
  fromIndex: number;
  toIndex: number;
  elapsedMinutes: number;
  totalMinutes: number;
  stationIndex: number;
}

export interface LiveTrainResponse {
  trainId: string;
  fromStation: string;
  toStation: string;
  currentStationIndex: number;
  etaMinutes: number;
  direction: number;
  lastHeartbeat: number;
}

/**
 * Tren telemetrisi gönder (POST /api/trains/:id/heartbeat)
 */
export async function sendHeartbeat(
  trainId: string,
  payload: HeartbeatPayload
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trains/${trainId}/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * İstasyona yaklaşan trenleri sorgula (GET /api/trains?station=...)
 */
export async function fetchTrainsAtStation(
  stationName: string
): Promise<LiveTrainResponse[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/trains?station=${encodeURIComponent(stationName)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.trains ?? [];
  } catch {
    return [];
  }
}

/**
 * Belirli bir trenin detayını getir (GET /api/trains/:id)
 */
export async function fetchTrainDetail(trainId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trains/${trainId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Treni sil (DELETE /api/trains/:id) — yolculuk bittiğinde
 */
export async function deleteTrain(trainId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trains/${trainId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
