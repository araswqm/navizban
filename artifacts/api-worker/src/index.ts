/**
 * Navizban API — Cloudflare Worker
 *
 * Express API sunucusunun birebir karşılığı.
 * Tren telemetri verileri Workers KV'de saklanır (TTL ile otomatik silinir).
 *
 * Dağıtım:
 *   1. Cloudflare Dashboard → Workers & Pages → KV → "NAVIZBAN_KV" namespace oluştur
 *   2. wrangler.toml'daki kv_namespaces kısmına namespace ID'yi yapıştır
 *   3. npm run deploy
 *   4. Cloudflare Dashboard → Workers → navizban-api → Triggers → Route: api.navizban.xyz/*
 */

import { NORTHBOUND_STATIONS, travelMinutes } from "./stations";

// ============================================================
// KV Anahtarları
// ============================================================
const KV_PREFIX = "train:";
const TTL_SECONDS = 60; // 60 saniye heartbeat gelmezse silinir

interface TrainTelemetry {
  trainId: string;
  anonymousTripId: string;
  stationIndex: number;
  fromIndex: number;
  toIndex: number;
  elapsedMinutes: number;
  totalMinutes: number;
  lastHeartbeat: number;
  direction: number;
  fromStation: string;
  toStation: string;
}

// ============================================================
// CORS
// ============================================================
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// ============================================================
// Router
// ============================================================
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // OPTIONS (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET /api/health
    if (path === "/api/health" && request.method === "GET") {
      return corsResponse({ status: "ok", version: "1.2.0-beta", timestamp: new Date().toISOString() });
    }

    // GET /api/trains — tüm trenler veya istasyona göre filtre
    if (path === "/api/trains" && request.method === "GET") {
      return handleGetTrains(url, env);
    }

    // GET /api/trains/:id — tek tren
    const trainMatch = path.match(/^\/api\/trains\/([^/]+)$/);
    if (trainMatch) {
      const trainId = trainMatch[1];
      if (request.method === "GET") {
        return handleGetTrain(trainId, env);
      }
      if (request.method === "POST" && path.endsWith("/heartbeat")) {
        return handleHeartbeat(trainId, request, env);
      }
      // POST /api/trains/:id/heartbeat
    }
    const heartbeatMatch = path.match(/^\/api\/trains\/([^/]+)\/heartbeat$/);
    if (heartbeatMatch && request.method === "POST") {
      return handleHeartbeat(heartbeatMatch[1], request, env);
    }

    return corsResponse({ error: "Not found" }, 404);
  },
};

// ============================================================
// GET /api/trains
// ============================================================
async function handleGetTrains(url: URL, env: Env): Promise<Response> {
  const stationParam = url.searchParams.get("station");
  const allTrains = await getAllActiveTrains(env);

  // Belirli istasyona göre filtrele
  if (stationParam) {
    const stationIdx = NORTHBOUND_STATIONS.findIndex(
      (s) => s.id === stationParam || s.name === stationParam
    );
    if (stationIdx === -1) {
      return corsResponse({ error: `unknown station: ${stationParam}` }, 400);
    }

    const approaching = allTrains.filter((tele) => {
      const trainDirection = tele.direction;
      const trainAtOrBefore =
        trainDirection === 1
          ? tele.stationIndex <= stationIdx
          : tele.stationIndex >= stationIdx;
      const notArrived =
        trainDirection === 1
          ? tele.stationIndex < tele.toIndex
          : tele.stationIndex > tele.toIndex;
      return trainAtOrBefore && notArrived;
    });

    const result = approaching.map((tele) => {
      const remaining = travelMinutes(
        NORTHBOUND_STATIONS[Math.round(tele.stationIndex)]?.id ?? tele.fromStation,
        NORTHBOUND_STATIONS[stationIdx]?.id ?? ""
      );
      return {
        trainId: tele.trainId,
        fromStation: tele.fromStation,
        toStation: tele.toStation,
        currentStationIndex: tele.stationIndex,
        etaMinutes: Math.max(0, remaining),
        direction: tele.direction,
        lastHeartbeat: tele.lastHeartbeat,
      };
    });

    return corsResponse({ station: stationParam, trains: result, count: result.length });
  }

  // Tüm trenler
  const result = allTrains.map((tele) => ({
    trainId: tele.trainId,
    fromStation: tele.fromStation,
    toStation: tele.toStation,
    currentStationIndex: tele.stationIndex,
    direction: tele.direction,
    lastHeartbeat: tele.lastHeartbeat,
  }));

  return corsResponse({ trains: result, count: result.length });
}

// ============================================================
// GET /api/trains/:id
// ============================================================
async function handleGetTrain(trainId: string, env: Env): Promise<Response> {
  const tele = await getTrain(trainId, env);
  if (!tele) {
    return corsResponse({ error: "train not found or expired" }, 404);
  }

  return corsResponse({
    trainId: tele.trainId,
    fromStation: tele.fromStation,
    toStation: tele.toStation,
    fromIndex: tele.fromIndex,
    toIndex: tele.toIndex,
    stationIndex: tele.stationIndex,
    elapsedMinutes: tele.elapsedMinutes,
    totalMinutes: tele.totalMinutes,
    direction: tele.direction,
    lastHeartbeat: tele.lastHeartbeat,
  });
}

// ============================================================
// POST /api/trains/:id/heartbeat
// ============================================================
async function handleHeartbeat(trainId: string, request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return corsResponse({ error: "invalid JSON" }, 400);
  }

  const { anonymousTripId, fromIndex, toIndex, elapsedMinutes, totalMinutes, stationIndex } = body;

  if (!anonymousTripId || fromIndex === undefined || toIndex === undefined) {
    return corsResponse({ error: "missing required fields: anonymousTripId, fromIndex, toIndex" }, 400);
  }

  const fromIdx = Number(fromIndex);
  const toIdx = Number(toIndex);
  const fromStation = NORTHBOUND_STATIONS[fromIdx];
  const toStation = NORTHBOUND_STATIONS[toIdx];

  if (!fromStation || !toStation) {
    return corsResponse({ error: "invalid station index" }, 400);
  }

  const direction = toIdx >= fromIdx ? 1 : -1;
  const existing = await getTrain(trainId, env);

  const tele: TrainTelemetry = existing
    ? {
        ...existing,
        stationIndex: stationIndex !== undefined ? Number(stationIndex) : existing.stationIndex,
        elapsedMinutes: elapsedMinutes !== undefined ? Number(elapsedMinutes) : existing.elapsedMinutes,
        lastHeartbeat: Date.now(),
      }
    : {
        trainId,
        anonymousTripId: String(anonymousTripId),
        fromIndex: fromIdx,
        toIndex: toIdx,
        stationIndex: stationIndex !== undefined ? Number(stationIndex) : fromIdx,
        elapsedMinutes: elapsedMinutes !== undefined ? Number(elapsedMinutes) : 0,
        totalMinutes: totalMinutes !== undefined ? Number(totalMinutes) : 0,
        lastHeartbeat: Date.now(),
        direction,
        fromStation: fromStation.name,
        toStation: toStation.name,
      };

  await putTrain(trainId, tele, env);

  return corsResponse({ status: existing ? "updated" : "created", trainId }, existing ? 200 : 201);
}

// ============================================================
// KV Yardımcıları
// ============================================================
async function getTrain(trainId: string, env: Env): Promise<TrainTelemetry | null> {
  if (!env.NAVIZBAN_KV) {
    // KV tanımlı değilse boş dön (geliştirme modu)
    return null;
  }
  const raw = await env.NAVIZBAN_KV.get(KV_PREFIX + trainId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TrainTelemetry;
  } catch {
    return null;
  }
}

async function putTrain(trainId: string, data: TrainTelemetry, env: Env): Promise<void> {
  if (!env.NAVIZBAN_KV) return;
  await env.NAVIZBAN_KV.put(KV_PREFIX + trainId, JSON.stringify(data), {
    expirationTtl: TTL_SECONDS,
  });
}

async function getAllActiveTrains(env: Env): Promise<TrainTelemetry[]> {
  if (!env.NAVIZBAN_KV) return [];
  const trains: TrainTelemetry[] = [];
  const list = await env.NAVIZBAN_KV.list({ prefix: KV_PREFIX });

  for (const key of list.keys) {
    const raw = await env.NAVIZBAN_KV.get(key.name);
    if (raw) {
      try {
        const tele = JSON.parse(raw) as TrainTelemetry;
        // TTL kontrolü (KV expiration her an tetiklenmeyebilir)
        if (Date.now() - tele.lastHeartbeat <= TTL_SECONDS * 1000) {
          trains.push(tele);
        }
      } catch { /* skip */ }
    }
  }
  return trains;
}

// ============================================================
// Tip tanımları
// ============================================================
interface Env {
  NAVIZBAN_KV?: KVNamespace;
}
