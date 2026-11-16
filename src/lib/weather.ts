import { readStore, writeStore } from './storage';

export const CURITIBA = { name: 'Curitiba, PR', lat: -25.4284, lon: -49.2733 };
const CACHE_KEY = 'weather-cache-v1';
const MAX_AGE = 30 * 60 * 1000; // 30 min

export interface HourPoint {
  time: string; // "AAAA-MM-DDTHH:00" no fuso de São Paulo
  temp: number | null;
  humidity: number | null;
  dewPoint: number | null;
  precipProb: number | null;
  precip: number | null;
  code: number | null;
  wind: number | null;
}
export interface DayPoint {
  date: string;
  code: number | null;
  tMax: number | null;
  tMin: number | null;
  precipSum: number | null;
  precipProbMax: number | null;
}
export interface Forecast {
  fetchedAt: number;
  source: 'open-meteo';
  current: { temp: number | null; feels: number | null; humidity: number | null; code: number | null; wind: number | null; precip: number | null; isDay: boolean } | null;
  hourly: HourPoint[];
  daily: DayPoint[];
}

export function buildForecastUrl() {
  const p = new URLSearchParams({
    latitude: String(CURITIBA.lat),
    longitude: String(CURITIBA.lon),
    hourly: 'temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    timezone: 'America/Sao_Paulo',
    forecast_days: '16',
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

type Num = (number | null)[];
/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseForecast(j: any, fetchedAt = Date.now()): Forecast {
  if (!j || !j.hourly || !Array.isArray(j.hourly.time)) throw new Error('Resposta da Open-Meteo sem dados horários.');
  const h = j.hourly;
  const g = (arr: Num | undefined, i: number) => (arr && typeof arr[i] === 'number' ? (arr[i] as number) : null);
  const hourly: HourPoint[] = h.time.map((t: string, i: number) => ({
    time: t,
    temp: g(h.temperature_2m, i),
    humidity: g(h.relative_humidity_2m, i),
    dewPoint: g(h.dew_point_2m, i),
    precipProb: g(h.precipitation_probability, i),
    precip: g(h.precipitation, i),
    code: g(h.weather_code, i),
    wind: g(h.wind_speed_10m, i),
  }));
  const d = j.daily ?? { time: [] };
  const daily: DayPoint[] = (d.time ?? []).map((t: string, i: number) => ({
    date: t,
    code: g(d.weather_code, i),
    tMax: g(d.temperature_2m_max, i),
    tMin: g(d.temperature_2m_min, i),
    precipSum: g(d.precipitation_sum, i),
    precipProbMax: g(d.precipitation_probability_max, i),
  }));
  const c = j.current;
  return {
    fetchedAt,
    source: 'open-meteo',
    current: c
      ? {
          temp: c.temperature_2m ?? null,
          feels: c.apparent_temperature ?? null,
          humidity: c.relative_humidity_2m ?? null,
          code: c.weather_code ?? null,
          wind: c.wind_speed_10m ?? null,
          precip: c.precipitation ?? null,
          isDay: c.is_day === 1,
        }
      : null,
    hourly,
    daily,
  };
}

export function getCachedForecast(): Forecast | null {
  return readStore<Forecast | null>(CACHE_KEY, null);
}

export async function fetchForecast(force = false): Promise<Forecast> {
  const cached = getCachedForecast();
  if (!force && cached && Date.now() - cached.fetchedAt < MAX_AGE) return cached;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(buildForecastUrl(), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}.`);
    const f = parseForecast(await res.json());
    writeStore(CACHE_KEY, f);
    return f;
  } finally {
    clearTimeout(timer);
  }
}

/** Códigos WMO usados pela Open-Meteo. */
export function describeCode(code: number | null): { label: string; kind: 'sun' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'unknown' } {
  if (code == null) return { label: 'Sem dado', kind: 'unknown' };
  if (code === 0) return { label: 'Céu limpo', kind: 'sun' };
  if (code <= 2) return { label: 'Poucas nuvens', kind: 'sun' };
  if (code === 3) return { label: 'Nublado', kind: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Neblina', kind: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Garoa', kind: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Chuva', kind: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Neve (?!)', kind: 'cloud' };
  if (code >= 95) return { label: 'Tempestade', kind: 'storm' };
  return { label: 'Instável', kind: 'cloud' };
}

/** Resumo para decisões entre módulos: chove hoje? dá pra ficar ao ar livre agora? */
export function outdoorOutlook(f: Forecast | null, nowIso: string, hoursAhead = 6): { status: 'ok' | 'risky' | 'bad' | 'unknown'; maxProb: number | null; rainMm: number } {
  if (!f) return { status: 'unknown', maxProb: null, rainMm: 0 };
  const idx = f.hourly.findIndex((h) => h.time >= nowIso);
  if (idx < 0) return { status: 'unknown', maxProb: null, rainMm: 0 };
  const slice = f.hourly.slice(idx, idx + hoursAhead);
  const probs = slice.map((h) => h.precipProb).filter((x): x is number => x != null);
  const maxProb = probs.length ? Math.max(...probs) : null;
  const rainMm = slice.reduce((s, h) => s + (h.precip ?? 0), 0);
  if (maxProb == null) return { status: 'unknown', maxProb, rainMm };
  if (rainMm >= 1 || maxProb >= 60) return { status: 'bad', maxProb, rainMm };
  if (maxProb >= 30 || rainMm > 0.2) return { status: 'risky', maxProb, rainMm };
  return { status: 'ok', maxProb, rainMm };
}
