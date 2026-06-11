/**
 * İZBAN istasyon verileri ve süre hesaplama
 * (lib/navizban-core ile birebir aynı — Worker bağımsız)
 */

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  arrivalMinutes: number;
}

interface StationRaw {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timeToNext: number;
}

const STATIONS_RAW: StationRaw[] = [
  { id: "aliaga",           name: "Aliağa",                    lat: 38.7889, lng: 26.9669, timeToNext: 4 },
  { id: "bicerova",         name: "Biçerova",                  lat: 38.7497, lng: 26.9603, timeToNext: 8 },
  { id: "hatundere",        name: "Hatundere",                 lat: 38.6900, lng: 27.0175, timeToNext: 8 },
  { id: "menemen",          name: "Menemen",                   lat: 38.6033, lng: 27.0767, timeToNext: 5 },
  { id: "egekent2",         name: "Egekent 2",                 lat: 38.5606, lng: 27.0444, timeToNext: 3 },
  { id: "ulukent",          name: "Ulukent",                   lat: 38.5486, lng: 27.0361, timeToNext: 4 },
  { id: "egekent",          name: "Egekent",                   lat: 38.5072, lng: 27.0461, timeToNext: 2 },
  { id: "atasanayi",        name: "Atasanayi",                 lat: 38.4989, lng: 27.0533, timeToNext: 3 },
  { id: "cigli",            name: "Çiğli",                     lat: 38.4919, lng: 27.0631, timeToNext: 3 },
  { id: "mavisehir",        name: "Mavişehir",                 lat: 38.4806, lng: 27.0844, timeToNext: 2 },
  { id: "semikler",         name: "Şemikler",                  lat: 38.4742, lng: 27.0906, timeToNext: 2 },
  { id: "demirkopru",       name: "Demirköprü",                lat: 38.4678, lng: 27.0967, timeToNext: 2 },
  { id: "nergiz",           name: "Nergiz",                    lat: 38.4592, lng: 27.1053, timeToNext: 2 },
  { id: "karsiyaka",        name: "Karşıyaka",                 lat: 38.4578, lng: 27.1144, timeToNext: 1 },
  { id: "alaybey",          name: "Alaybey",                   lat: 38.4608, lng: 27.1217, timeToNext: 1 },
  { id: "naldoken",         name: "Naldöken",                  lat: 38.4647, lng: 27.1283, timeToNext: 2 },
  { id: "turan",            name: "Turan",                     lat: 38.4669, lng: 27.1497, timeToNext: 2 },
  { id: "bayrakli",         name: "Bayraklı",                  lat: 38.4639, lng: 27.1644, timeToNext: 2 },
  { id: "salhane",          name: "Salhane",                   lat: 38.4508, lng: 27.1722, timeToNext: 3 },
  { id: "halkapinar",       name: "Halkapınar",                lat: 38.4348, lng: 27.1686, timeToNext: 9 },
  { id: "alsancak",         name: "Alsancak",                  lat: 38.4395, lng: 27.1479, timeToNext: 4 },
  { id: "hilal",            name: "Hilal",                     lat: 38.4255, lng: 27.1544, timeToNext: 2 },
  { id: "kemer",            name: "Kemer",                     lat: 38.4222, lng: 27.1558, timeToNext: 5 },
  { id: "sirinyer",         name: "Şirinyer",                  lat: 38.3933, lng: 27.1469, timeToNext: 2 },
  { id: "kosu",             name: "Koşu",                      lat: 38.3842, lng: 27.1475, timeToNext: 2 },
  { id: "inkilap",          name: "İnkılap",                   lat: 38.3689, lng: 27.1417, timeToNext: 2 },
  { id: "semtgaraji",       name: "Semt Garajı",               lat: 38.3569, lng: 27.1367, timeToNext: 2 },
  { id: "esbas",            name: "Esbaş",                     lat: 38.3361, lng: 27.1367, timeToNext: 2 },
  { id: "gaziemir",         name: "Gaziemir",                  lat: 38.3264, lng: 27.1400, timeToNext: 2 },
  { id: "sarnic",           name: "Sarnıç",                    lat: 38.3119, lng: 27.1447, timeToNext: 3 },
  { id: "adnanmenderes",    name: "Adnan Menderes Havalimanı", lat: 38.2911, lng: 27.1481, timeToNext: 4 },
  { id: "cumaovasi",        name: "Cumaovası",                 lat: 38.2625, lng: 27.1631, timeToNext: 7 },
  { id: "develi",           name: "Develi",                    lat: 38.2031, lng: 27.1681, timeToNext: 3 },
  { id: "tekeli",           name: "Tekeli",                    lat: 38.1811, lng: 27.1856, timeToNext: 5 },
  { id: "pancar",           name: "Pancar",                    lat: 38.1975, lng: 27.2397, timeToNext: 5 },
  { id: "kuscuburun",       name: "Kuşçuburun",                lat: 38.2094, lng: 27.3089, timeToNext: 6 },
  { id: "torbali",          name: "Torbalı",                   lat: 38.1697, lng: 27.3472, timeToNext: 3 },
  { id: "tepekoy",          name: "Tepeköy",                   lat: 38.1472, lng: 27.3613, timeToNext: 7 },
  { id: "saglik",           name: "Sağlık",                    lat: 38.0846, lng: 27.4008, timeToNext: 6 },
  { id: "belevi",           name: "Belevi",                    lat: 38.0306, lng: 27.4331, timeToNext: 10 },
  { id: "selcuk",           name: "Selçuk",                    lat: 37.9509, lng: 27.3731, timeToNext: 0 },
];

function buildStations(): Station[] {
  let cum = 0;
  return STATIONS_RAW.map((r) => {
    const st: Station = {
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      arrivalMinutes: cum,
    };
    cum += r.timeToNext;
    return st;
  });
}

export const NORTHBOUND_STATIONS: Station[] = buildStations();

/** İki istasyon arası süre (dk) */
export function travelMinutes(fromId: string, toId: string): number {
  const from = NORTHBOUND_STATIONS.find((s) => s.id === fromId);
  const to = NORTHBOUND_STATIONS.find((s) => s.id === toId);
  if (!from || !to) return 0;
  return Math.abs(to.arrivalMinutes - from.arrivalMinutes);
}
