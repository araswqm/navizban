import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { NORTHBOUND_STATIONS, travelMinutes, getCumulativeMinutes } from "@workspace/navizban-core";

export const trainsRouter = Router();

// ============================================================
// Bellek içi anonim tren telemetri deposu
// ============================================================

interface TrainTelemetry {
  trainId: string;
  /** Anonim yolculuk kimliği (her yolculukta yeniden oluşturulur) */
  anonymousTripId: string;
  /** Mevcut istasyon indeksi (küsüratlı olabilir) */
  stationIndex: number;
  /** Biniş istasyonu indeksi */
  fromIndex: number;
  /** Varış istasyonu indeksi */
  toIndex: number;
  /** Yolculukta geçen dakika */
  elapsedMinutes: number;
  /** Toplam yolculuk süresi */
  totalMinutes: number;
  /** Son güncelleme zamanı */
  lastHeartbeat: number;
  /** Yön (1: kuzey, -1: güney) */
  direction: number;
  /** Biniş istasyonu adı */
  fromStation: string;
  /** Varış istasyonu adı */
  toStation: string;
}

/** Aktif trenler (trainId -> telemetri) */
const activeTrains = new Map<string, TrainTelemetry>();

/** TTL: 60 saniye heartbeat gelmezse tren pasif sayılır */
const TTL_MS = 60_000;

/** Periyodik temizlik */
setInterval(() => {
  const now = Date.now();
  for (const [id, tele] of activeTrains) {
    if (now - tele.lastHeartbeat > TTL_MS) {
      activeTrains.delete(id);
    }
  }
}, 30_000);

// ============================================================
// POST /api/trains/:id/heartbeat — Tren telemetrisi gönder
// ============================================================

trainsRouter.post("/trains/:id/heartbeat", (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    anonymousTripId,
    fromIndex,
    toIndex,
    elapsedMinutes,
    totalMinutes,
    stationIndex,
  } = req.body;

  if (!anonymousTripId || fromIndex === undefined || toIndex === undefined) {
    res.status(400).json({ error: "missing required fields: anonymousTripId, fromIndex, toIndex" });
    return;
  }

  const fromStation = NORTHBOUND_STATIONS[fromIndex];
  const toStation = NORTHBOUND_STATIONS[toIndex];
  if (!fromStation || !toStation) {
    res.status(400).json({ error: "invalid station index" });
    return;
  }

  const direction = toIndex >= fromIndex ? 1 : -1;

  const existing = activeTrains.get(id);
  if (existing) {
    existing.stationIndex = stationIndex ?? existing.stationIndex;
    existing.elapsedMinutes = elapsedMinutes ?? existing.elapsedMinutes;
    existing.lastHeartbeat = Date.now();
    res.json({ status: "updated", trainId: id });
  } else {
    const tele: TrainTelemetry = {
      trainId: id,
      anonymousTripId,
      fromIndex,
      toIndex,
      stationIndex: stationIndex ?? fromIndex,
      elapsedMinutes: elapsedMinutes ?? 0,
      totalMinutes,
      lastHeartbeat: Date.now(),
      direction,
      fromStation: fromStation.name,
      toStation: toStation.name,
    };
    activeTrains.set(id, tele);
    res.status(201).json({ status: "created", trainId: id });
  }
});

// ============================================================
// GET /api/trains — Aktif trenleri listele
// ============================================================

trainsRouter.get("/trains", (req: Request, res: Response) => {
  const now = Date.now();
  const stationParam = req.query.station as string | undefined;

  // TTL kontrolü
  const active: TrainTelemetry[] = [];
  for (const tele of activeTrains.values()) {
    if (now - tele.lastHeartbeat <= TTL_MS) {
      active.push(tele);
    }
  }

  if (stationParam) {
    // Belirli bir istasyona yaklaşan/gelen trenleri filtrele
    const stationIdx = NORTHBOUND_STATIONS.findIndex(
      (s) => s.id === stationParam || s.name === stationParam
    );
    if (stationIdx === -1) {
      res.status(400).json({ error: `unknown station: ${stationParam}` });
      return;
    }

    const approaching = active.filter((tele) => {
      // Aynı yönde ve tren istasyona doğru yaklaşıyor veya istasyonda
      const trainDirection = tele.direction;
      const trainAtOrBefore =
        trainDirection === 1
          ? tele.stationIndex <= stationIdx
          : tele.stationIndex >= stationIdx;
      // Tren henüz varış noktasına ulaşmamış
      const notArrived =
        trainDirection === 1
          ? tele.stationIndex < tele.toIndex
          : tele.stationIndex > tele.toIndex;
      return trainAtOrBefore && notArrived;
    });

    const result = approaching.map((tele) => {
      const remaining = travelMinutes(
        NORTHBOUND_STATIONS[Math.round(tele.stationIndex)]?.id ?? tele.fromStation,
        NORTHBOUND_STATIONS[stationIdx]?.id
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

    res.json({ station: stationParam, trains: result, count: result.length });
    return;
  }

  // Tüm aktif trenler
  const result = active.map((tele) => ({
    trainId: tele.trainId,
    fromStation: tele.fromStation,
    toStation: tele.toStation,
    currentStationIndex: tele.stationIndex,
    direction: tele.direction,
    lastHeartbeat: tele.lastHeartbeat,
  }));

  res.json({ trains: result, count: result.length });
});

// ============================================================
// GET /api/trains/:id — Belirli bir trenin detayı
// ============================================================

trainsRouter.get("/trains/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const tele = activeTrains.get(id);
  if (!tele) {
    res.status(404).json({ error: "train not found or expired" });
    return;
  }
  if (Date.now() - tele.lastHeartbeat > TTL_MS) {
    activeTrains.delete(id);
    res.status(404).json({ error: "train expired" });
    return;
  }
  res.json({
    trainId: tele.trainId,
    fromStation: tele.fromStation,
    toStation: tele.toStation,
    fromIndex: tele.fromIndex,
    toIndex: tele.toIndex,
    currentStationIndex: tele.stationIndex,
    elapsedMinutes: tele.elapsedMinutes,
    totalMinutes: tele.totalMinutes,
    direction: tele.direction,
    lastHeartbeat: tele.lastHeartbeat,
  });
});

// ============================================================
// DELETE /api/trains/:id — Yolculuk bittiğinde treni sil
// ============================================================

trainsRouter.delete("/trains/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = activeTrains.delete(id);
  if (deleted) {
    res.json({ status: "deleted", trainId: id });
  } else {
    res.status(404).json({ error: "train not found" });
  }
});
