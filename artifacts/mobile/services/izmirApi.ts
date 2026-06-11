/**
 * İzmir Büyükşehir Belediyesi Açık Veri Portalı - İZBAN API Servisi
 * Kaynak: https://openapi.izmir.bel.tr/api/izban
 *
 * Bu servis, İZBAN sefer saatlerini (resmî tarifeye göre) sorgular.
 * Gerçek zamanlı yolcu GPS konumu olmadığında tahmini varış süresi
 * hesaplamak için kullanılır.
 */

const API_BASE = "https://openapi.izmir.bel.tr/api/izban";

/** Navizban istasyon ID'si → İzmir API istasyon ID'si eşleştirmesi */
const STATION_ID_MAP: Record<string, number> = {
  aliaga: 1,
  bicerova: 2,
  hatundere: 3,
  menemen: 4,
  egekent2: 5,
  ulukent: 6,
  egekent: 7,
  atasanayi: 8,
  cigli: 9,
  mavisehir: 10,
  semikler: 11,
  demirkopru: 13,
  nergiz: 14,
  karsiyaka: 15,
  alaybey: 16,
  naldoken: 17,
  turan: 18,
  bayrakli: 19,
  salhane: 20,
  halkapinar: 21,
  kemer: 23,
  sirinyer: 24,
  kosu: 25,
  inkılap: 26,
  semtgaraji: 27,
  esbas: 28,
  gaziemir: 29,
  sarnic: 30,
  adnanmenderes: 31,
  cumaovasi: 32,
  alsancak: 34,
  hilal: 35,
  develi: 38,
  tekeli: 40,
  pancar: 42,
  kuscuburun: 43,
  torbali: 44,
  tepekoy: 45,
  saglik: 47,
  selcuk: 48,
  belevi: 50,
};

export interface IzmirScheduleEntry {
  HareketIstasyonId: number;
  HareketIstasyonAdi: string;
  VarisIstasyonId: number;
  VarisIstasyonAdi: string;
  HareketSaati: string; // "HH:mm:ss"
  VarisSaati: string;   // "HH:mm:ss"
}

export interface ScheduleTrain {
  trainId: string;
  fromStationId: string;
  fromStationName: string;
  toStationId: string;
  toStationName: string;
  departureTime: string; // "HH:mm"
  arrivalTime: string;   // "HH:mm"
  etaMinutes: number;    // Bu istasyona kaç dakika sonra varacak
}

/**
 * Navizban istasyon ID'sini İzmir API ID'sine çevir
 */
export function getIzmirStationId(navizbanStationId: string): number | null {
  return STATION_ID_MAP[navizbanStationId] ?? null;
}

/**
 * İzmir API'sinden iki istasyon arası sefer saatlerini getir
 */
export async function fetchSchedule(
  fromStationId: string,
  toStationId: string
): Promise<IzmirScheduleEntry[]> {
  const fromId = getIzmirStationId(fromStationId);
  const toId = getIzmirStationId(toStationId);
  if (!fromId || !toId) return [];

  try {
    const url = `${API_BASE}/sefersaatleri/${fromId}/${toId}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: IzmirScheduleEntry[] = await res.json();
    return data;
  } catch {
    return [];
  }
}

/**
 * Verilen istasyona şu anki saate göre yaklaşan trenleri bul
 * (bir sonraki sefer(ler)i döndürür)
 *
 * @param stationId - Trenin yaklaştığı istasyonun Navizban ID'si
 * @param direction - İstenen yön: 1 = Kuzey (Selçuk→Aliağa), -1 = Güney (Aliağa→Selçuk)
 * @param maxResults - En fazla kaç tren döndürülecek
 */
export async function getApproachingTrains(
  stationId: string,
  direction?: 1 | -1,
  maxResults = 4
): Promise<ScheduleTrain[]> {
  // İzmir API'sinde tüm istasyon ID'leri
  const allStationIds = Object.values(STATION_ID_MAP).sort((a, b) => a - b);
  const targetId = getIzmirStationId(stationId);
  if (!targetId) return [];

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const results: ScheduleTrain[] = [];
  const seen = new Set<string>();

  // Her bir kaynak istasyon için seferleri kontrol et
  // (hedef istasyona yaklaşan trenleri bulmak için)
  for (const srcId of allStationIds) {
    if (srcId === targetId) continue;

    // Yön filtresi: Kuzey (Aliağa yönü) için srcId > targetId, Güney için srcId < targetId
    if (direction === 1 && srcId < targetId) continue; // Kuzey: daha büyük ID'den geliyor olmalı
    if (direction === -1 && srcId > targetId) continue; // Güney: daha küçük ID'den geliyor olmalı
    if (!direction && Math.abs(srcId - targetId) > 15) continue; // Yönsüz: çok uzaksa atla

    try {
      const url = `${API_BASE}/sefersaatleri/${srcId}/${targetId}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data: IzmirScheduleEntry[] = await res.json();

      for (const entry of data) {
        const [h, m] = entry.VarisSaati.split(":").map(Number);
        const arrivalMinutes = h * 60 + m;

        // Gece yarısını geçmiş seferleri de hesaba kat
        let diff = arrivalMinutes - currentMinutes;
        if (diff < -120) diff += 24 * 60; // 2 saatten eskiyse yarınki sefer olabilir
        if (diff < -5) continue; // 5 dakikadan eski seferleri gösterme
        if (diff > 120) continue; // 2 saatten uzak seferleri gösterme

        const key = `${entry.HareketIstasyonId}-${entry.VarisIstasyonId}-${entry.HareketSaati}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          trainId: `izmir-${entry.HareketIstasyonId}-${entry.VarisIstasyonId}-${entry.HareketSaati}`,
          fromStationId: String(entry.HareketIstasyonId),
          fromStationName: entry.HareketIstasyonAdi,
          toStationId: String(entry.VarisIstasyonId),
          toStationName: entry.VarisIstasyonAdi,
          departureTime: entry.HareketSaati.substring(0, 5),
          arrivalTime: entry.VarisSaati.substring(0, 5),
          etaMinutes: Math.max(0, diff),
        });

        if (results.length >= maxResults) break;
      }
    } catch {
      continue;
    }

    if (results.length >= maxResults) break;
  }

  // ETA'ya göre sırala (en yakın önce)
  results.sort((a, b) => a.etaMinutes - b.etaMinutes);
  return results.slice(0, maxResults);
}
