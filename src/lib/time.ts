export const TZ = 'America/Sao_Paulo';

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
});

/** Data/hora "de parede" em São Paulo. */
export function spNow(d = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  const hour = Number(p.hour) % 24;
  return { date: `${p.year}-${p.month}-${p.day}`, hour, minute: Number(p.minute), weekday: weekdayOf(`${p.year}-${p.month}-${p.day}`) };
}

/** 0 = domingo. Calcula a partir de AAAA-MM-DD sem depender do fuso do aparelho. */
export function weekdayOf(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(isoDate: string, n: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

const WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WD_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function fmtDay(isoDate: string, style: 'long' | 'short' = 'long') {
  const [, m, d] = isoDate.split('-').map(Number);
  const w = weekdayOf(isoDate);
  return style === 'long' ? `${WD[w]}, ${d} de ${MO[m - 1]}` : `${WD_SHORT[w]} ${d}/${String(m).padStart(2, '0')}`;
}
export const weekdayShort = (iso: string) => WD_SHORT[weekdayOf(iso)];
export const dayNum = (iso: string) => Number(iso.slice(8, 10));
export const monthShort = (iso: string) => MO[Number(iso.slice(5, 7)) - 1];

export function fmtClock(d = new Date()) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
}
export function fmtDateTime(ts: number) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}
export function fmtLongToday(d = new Date()) {
  const s = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Semente estável por dia (desafio do dia etc.). */
export function daySeed(isoDate: string) {
  let h = 2166136261;
  for (const c of isoDate) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
