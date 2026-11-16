import { ACTIVITIES, type Activity, type Company, type Cost, type TimeBox, type Vibe, type Where } from '../data/activities';
import { PLACES, type Place } from '../data/curitiba';

export type WeatherStatus = 'ok' | 'risky' | 'bad' | 'unknown';
export interface BoredFilters {
  where: Where | 'tanto-faz';
  company: Company;
  cost: Cost;
  time: TimeBox;
  vibe: Vibe | 'qualquer';
  space: 'interna' | 'externa' | 'tanto-faz';
}
export interface Suggestion {
  activity: Activity;
  score: number;
  weatherNote: string | null; // aviso de clima quando a atividade é ao ar livre
  blocked: boolean; // externa com chuva prevista
}

const TIME_HOURS: Record<TimeBox, number> = { '15m': 0.25, '1h': 1, horas: 3.5, dia: 9 };

/** Converte lugares de Curitiba em atividades "na rua". */
export function placeToActivity(p: Place): Activity {
  const vibes: Vibe[] = [];
  if (p.cats.includes('natureza')) vibes.push('relaxante');
  if (p.cats.some((c) => c === 'museus' || c === 'cultura' || c === 'teatro')) vibes.push('cultural');
  if (p.cats.some((c) => c === 'restaurantes' || c === 'cafes')) vibes.push('gastronomico');
  if (p.cats.some((c) => c === 'jogos')) vibes.push('divertido');
  if (p.cats.includes('diferentes')) vibes.push('inesperado');
  if (!vibes.length) vibes.push('divertido');
  const cost: Cost = p.budget === 'gratis' ? 'gratis' : p.budget === 'economico' ? 'economico' : 'livre';
  const time: TimeBox[] = p.durationH <= 1 ? ['1h', 'horas', 'dia'] : p.durationH <= 3 ? ['horas', 'dia'] : ['dia'];
  return {
    id: 'p-' + p.id, title: p.name, text: p.blurb, where: 'rua', outdoor: !p.indoor,
    company: ['sozinha', 'acompanhada'], cost, time, vibes, placeId: p.id,
  };
}

const COST_RANK: Record<Cost, number> = { gratis: 0, economico: 1, livre: 2 };

export function recommend(f: BoredFilters, weather: WeatherStatus, pool: Activity[] = [...ACTIVITIES, ...PLACES.map(placeToActivity)]): Suggestion[] {
  const out: Suggestion[] = [];
  for (const a of pool) {
    if (f.where !== 'tanto-faz' && a.where !== f.where) continue;
    if (!a.company.includes(f.company)) continue;
    if (COST_RANK[a.cost] > COST_RANK[f.cost]) continue;
    if (!a.time.includes(f.time)) continue;
    if (f.space === 'interna' && a.outdoor) continue;
    if (f.space === 'externa' && !a.outdoor) continue;
    let score = 1;
    if (f.vibe !== 'qualquer') {
      if (!a.vibes.includes(f.vibe)) continue;
      score += 2;
    }
    let weatherNote: string | null = null;
    let blocked = false;
    if (a.outdoor) {
      if (weather === 'bad') { blocked = true; weatherNote = 'Chuva prevista nas próximas horas. Guarde para outro dia.'; score -= 5; }
      else if (weather === 'risky') { weatherNote = 'Chance de chuva nas próximas horas: leve guarda-chuva.'; score -= 1; }
      else if (weather === 'unknown') { weatherNote = 'Não consegui confirmar o clima. Veja o céu antes de sair.'; score -= 0.5; }
      else { score += 1; }
    } else if (weather === 'bad' || weather === 'risky') {
      score += 1.5; // dia de chuva favorece programas cobertos
    }
    if (TIME_HOURS[f.time] >= 3 && a.time.length === 1) score += 0.5;
    out.push({ activity: a, score, weatherNote, blocked });
  }
  return out.sort((x, y) => y.score - x.score);
}

/** Sorteio ponderado entre as melhores, para não repetir sempre a mesma. */
export function pick<T extends { score: number }>(list: T[], rnd = Math.random): T | null {
  const top = list.filter((s) => s.score > 0).slice(0, 8);
  if (!top.length) return list[0] ?? null;
  const total = top.reduce((s, x) => s + x.score, 0);
  let r = rnd() * total;
  for (const x of top) { r -= x.score; if (r <= 0) return x; }
  return top[top.length - 1];
}
