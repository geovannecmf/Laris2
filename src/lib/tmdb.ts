import type { Title, Mood } from '../data/titles';

/** Cliente do proxy /api/tmdb (Cloudflare Pages Function). Sem token configurado → indisponível. */
export const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
let statusPromise: Promise<boolean> | null = null;

export class TmdbUnavailable extends Error {}

export async function tmdb<T = unknown>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`/api/tmdb/${path}${q.toString() ? '?' + q : ''}`, { signal: ctrl.signal });
    const type = res.headers.get('content-type') ?? '';
    if (res.status === 503 || res.status === 404 && !type.includes('json')) throw new TmdbUnavailable('TMDB não configurado.');
    if (!type.includes('json')) throw new TmdbUnavailable('Proxy do TMDB indisponível neste ambiente.');
    if (!res.ok) throw new Error(`TMDB respondeu ${res.status}.`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function tmdbAvailable(): Promise<boolean> {
  if (!statusPromise) statusPromise = tmdb('configuration').then(() => true, () => false);
  return statusPromise;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const GENRES: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime', 99: 'Documentário', 18: 'Drama', 10751: 'Família',
  14: 'Fantasia', 36: 'Histórico', 27: 'Terror', 10402: 'Musical', 9648: 'Mistério', 10749: 'Romance', 878: 'Ficção científica',
  53: 'Suspense', 10752: 'Guerra', 37: 'Faroeste', 10759: 'Ação', 10765: 'Ficção científica', 10768: 'Guerra', 10764: 'Reality', 10767: 'Talk show',
};
function moodsFrom(ids: number[]): Mood[] {
  const m = new Set<Mood>();
  if (ids.some((g) => [35, 16, 10751].includes(g))) m.add('leve');
  if (ids.includes(35)) m.add('engracado');
  if (ids.includes(10749)) m.add('romantico');
  if (ids.some((g) => [18, 53, 27, 80, 10752].includes(g))) m.add('intenso');
  if (ids.some((g) => [9648, 878, 14, 10765].includes(g))) m.add('surpreendente');
  return [...m];
}
export function fromTmdb(r: any, type: 'filme' | 'serie'): Title {
  const ids: number[] = r.genre_ids ?? (r.genres ?? []).map((g: any) => g.id);
  return {
    id: `tmdb-${type}-${r.id}`,
    title: r.title ?? r.name ?? 'Sem título',
    original: r.original_title ?? r.original_name,
    year: Number((r.release_date ?? r.first_air_date ?? '').slice(0, 4)) || 0,
    type,
    genres: [...new Set(ids.map((g) => GENRES[g]).filter(Boolean))],
    moods: moodsFrom(ids),
    minutes: r.runtime ?? (r.episode_run_time?.[0] ?? 0),
    synopsis: r.overview || 'Sinopse não disponível em português.',
    poster: r.poster_path ? TMDB_IMG + r.poster_path : undefined,
    source: 'tmdb',
  };
}
export const GENRE_IDS = Object.fromEntries(Object.entries(GENRES).map(([k, v]) => [v, Number(k)]));
