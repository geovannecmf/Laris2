import type { HourPoint } from './weather';
import { addDays, daysBetween } from './time';

export type PaintMode = 'interna' | 'externa';
export type PaintType = 'acrilica' | 'pva' | 'esmalte-agua' | 'esmalte-solvente' | 'epoxi' | 'textura';
export type Room = 'sala' | 'quarto' | 'cozinha' | 'banheiro' | 'lavanderia' | 'fachada' | 'muro' | 'varanda';
export type Ventilation = 'boa' | 'media' | 'ruim';
export type Level = 'ok' | 'warn' | 'bad' | 'none';
export type Verdict = 'favoravel' | 'atencao' | 'desfavoravel' | 'insuficiente';

export interface PaintConfig {
  mode: PaintMode;
  room: Room;
  date: string; // AAAA-MM-DD
  startHour: number; // 0-23
  paint: PaintType;
  coats: number;
  coatIntervalH: number; // intervalo entre demãos (fabricante)
  coatDurationH: number; // tempo para aplicar cada demão
  protectionH: number; // horas após a última demão sem chuva/umidade alta (fabricante)
  ventilation: Ventilation;
}

/** Referências genéricas de mercado — o rótulo do fabricante sempre prevalece. */
export const PAINTS: Record<PaintType, { label: string; interval: number; protection: number; internalOnly?: boolean; note: string }> = {
  acrilica: { label: 'Acrílica (látex acrílico)', interval: 4, protection: 24, note: 'Rótulos costumam indicar 4 h entre demãos e aplicação entre 10 °C e 40 °C, com umidade abaixo de 85%.' },
  pva: { label: 'Látex PVA', interval: 4, protection: 12, internalOnly: true, note: 'Indicada para áreas internas secas. Não é a escolha usual para banheiro nem área externa.' },
  'esmalte-agua': { label: 'Esmalte à base d’água', interval: 6, protection: 24, note: 'Secagem ao toque rápida, mas a cura completa demora mais que a acrílica.' },
  'esmalte-solvente': { label: 'Esmalte sintético (solvente)', interval: 12, protection: 24, note: 'Exige muita ventilação pelo cheiro e vapores. Intervalos longos entre demãos.' },
  epoxi: { label: 'Epóxi', interval: 12, protection: 72, note: 'Normalmente bicomponente, com tempo de vida útil da mistura. Siga à risca a ficha técnica.' },
  textura: { label: 'Textura acrílica', interval: 12, protection: 48, note: 'Camada espessa: seca mais devagar e sofre mais com umidade alta.' },
};

export const ROOMS: Record<Room, { label: string; mode: PaintMode; wet?: boolean }> = {
  sala: { label: 'Sala', mode: 'interna' },
  quarto: { label: 'Quarto', mode: 'interna' },
  cozinha: { label: 'Cozinha', mode: 'interna', wet: true },
  banheiro: { label: 'Banheiro', mode: 'interna', wet: true },
  lavanderia: { label: 'Lavanderia', mode: 'interna', wet: true },
  fachada: { label: 'Fachada', mode: 'externa' },
  muro: { label: 'Muro', mode: 'externa' },
  varanda: { label: 'Varanda aberta', mode: 'externa' },
};

export function defaultConfig(date: string): PaintConfig {
  return { mode: 'interna', room: 'sala', date, startHour: 9, paint: 'acrilica', coats: 2, coatIntervalH: 4, coatDurationH: 2, protectionH: 24, ventilation: 'boa' };
}

export interface Reason { level: 'ok' | 'warn' | 'bad' | 'info'; text: string }
export interface HourEval { time: string; phase: 'aplicacao' | 'secagem'; level: Level; point: HourPoint | null; notes: string[] }
export interface AfterBlock { label: string; maxProb: number | null; rainMm: number | null; level: Level }
export interface PaintEvaluation {
  verdict: Verdict;
  confidence: { label: 'alta' | 'média' | 'baixa' | 'muito baixa' | 'manual' | 'nenhuma'; detail: string };
  reasons: Reason[];
  cautions: string[];
  hours: HourEval[];
  after: AfterBlock[];
  window: { start: string; paintEnd: string; dryEnd: string; totalH: number };
  criteria: string[];
}

const MIN_TEMP = 10;
const MAX_TEMP = 35;
const HUM_BAD = 85;

const hourIso = (date: string, h: number) => {
  const d = addDays(date, Math.floor(h / 24));
  return `${d}T${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`;
};
const hh = (iso: string) => `${Number(iso.slice(11, 13))}h`;
const fmt1 = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function windowHours(cfg: PaintConfig) {
  const paintSpan = Math.max(1, (cfg.coats - 1) * cfg.coatIntervalH + cfg.coatDurationH);
  return { paintSpan, total: paintSpan + Math.max(0, cfg.protectionH) };
}

export function evaluatePaint(cfg: PaintConfig, hourly: HourPoint[], todayIso: string, manual = false): PaintEvaluation {
  const ext = cfg.mode === 'externa';
  const room = ROOMS[cfg.room];
  const { paintSpan, total } = windowHours(cfg);
  const byTime = new Map(hourly.map((h) => [h.time, h]));
  const start = hourIso(cfg.date, cfg.startHour);
  const paintEnd = hourIso(cfg.date, cfg.startHour + paintSpan);
  const dryEnd = hourIso(cfg.date, cfg.startHour + total);

  const criteria = [
    `Aplicação: temperatura entre ${MIN_TEMP} °C e ${MAX_TEMP} °C e umidade relativa abaixo de ${HUM_BAD}% (faixa comum em fichas técnicas).`,
    ext ? 'Externa: nenhuma chuva medida durante a aplicação e nas horas de proteção informadas; probabilidade de chuva acima de 50% na aplicação ou 60% na secagem reprova.' : 'Interna: chuva não molha a parede, mas deixa o ar úmido e obriga a fechar janelas — vira alerta.',
    ext ? 'Ponto de orvalho: se a temperatura fica a menos de 3 °C do ponto de orvalho, há risco de condensação na superfície.' : 'Ventilação informada ajusta a tolerância à umidade.',
    ext ? 'Vento acima de 30 km/h pede atenção (poeira e secagem irregular); acima de 45 km/h reprova.' : 'Banheiro, cozinha e lavanderia recebem alertas extras de vapor e mofo.',
    'Confiança cai conforme a data se afasta: previsões além de 5 dias mudam bastante.',
  ];

  const hours: HourEval[] = [];
  let missing = 0;
  let missingKey = 0;
  const flags = {
    rainPaint: [] as string[], rainPaintMm: 0, probPaintBad: 0, probPaintWarn: 0,
    rainDry: [] as string[], rainDryMm: 0, probDryBad: 0, probDryWarn: 0,
    cold: [] as string[], hot: [] as string[], humBad: [] as string[], humWarn: [] as string[],
    dew: [] as string[], windWarn: 0, windBad: 0, humDryHigh: 0, coldDry: 0,
  };
  const humWarnAt = ext ? 75 : cfg.ventilation === 'boa' ? 80 : cfg.ventilation === 'media' ? 75 : 70;

  for (let i = 0; i < total; i++) {
    const time = hourIso(cfg.date, cfg.startHour + i);
    const p = byTime.get(time) ?? null;
    const phase: HourEval['phase'] = i < paintSpan ? 'aplicacao' : 'secagem';
    const notes: string[] = [];
    let level: Level = 'ok';
    const bump = (l: Level) => { if (l === 'bad' || (l === 'warn' && level === 'ok')) level = l; };
    if (!p) { missing++; hours.push({ time, phase, level: 'none', point: null, notes: ['Sem previsão para esta hora'] }); continue; }
    if (p.temp == null || p.humidity == null || (ext && p.precip == null && p.precipProb == null)) missingKey++;

    if (phase === 'aplicacao') {
      if (p.temp != null) {
        if (p.temp < MIN_TEMP) { bump('bad'); flags.cold.push(time); notes.push(`${fmt1(p.temp)} °C: frio demais para aplicar`); }
        else if (p.temp < MIN_TEMP + 2) { bump('warn'); notes.push(`${fmt1(p.temp)} °C: no limite inferior`); }
        else if (p.temp > MAX_TEMP) { bump('warn'); flags.hot.push(time); notes.push(`${fmt1(p.temp)} °C: seca rápido demais, pode marcar`); }
      }
      if (p.humidity != null) {
        if (p.humidity >= HUM_BAD) { bump('bad'); flags.humBad.push(time); notes.push(`Umidade ${p.humidity}%`); }
        else if (p.humidity >= humWarnAt) { bump('warn'); flags.humWarn.push(time); notes.push(`Umidade ${p.humidity}%`); }
      }
      if (ext && p.temp != null && p.dewPoint != null && p.temp - p.dewPoint < 3) {
        bump(p.temp - p.dewPoint < 2 ? 'bad' : 'warn'); flags.dew.push(time); notes.push('Perto do ponto de orvalho');
      }
      if (ext) {
        if ((p.precip ?? 0) > 0.1) { bump('bad'); flags.rainPaint.push(time); flags.rainPaintMm += p.precip ?? 0; notes.push(`Chuva ${fmt1(p.precip ?? 0)} mm`); }
        else if ((p.precipProb ?? 0) >= 50) { bump('bad'); flags.probPaintBad++; notes.push(`Chance de chuva ${p.precipProb}%`); }
        else if ((p.precipProb ?? 0) >= 25) { bump('warn'); flags.probPaintWarn++; notes.push(`Chance de chuva ${p.precipProb}%`); }
        if ((p.wind ?? 0) > 45) { bump('bad'); flags.windBad++; notes.push(`Vento ${Math.round(p.wind ?? 0)} km/h`); }
        else if ((p.wind ?? 0) > 30) { bump('warn'); flags.windWarn++; notes.push(`Vento ${Math.round(p.wind ?? 0)} km/h`); }
      } else if ((p.precipProb ?? 0) >= 60 || (p.precip ?? 0) > 0.5) {
        bump('warn'); flags.probPaintWarn++; notes.push('Chuva lá fora: ar mais úmido');
      }
    } else {
      if (ext) {
        if ((p.precip ?? 0) > 0.1) { bump('bad'); flags.rainDry.push(time); flags.rainDryMm += p.precip ?? 0; notes.push(`Chuva ${fmt1(p.precip ?? 0)} mm`); }
        else if ((p.precipProb ?? 0) >= 60) { bump('bad'); flags.probDryBad++; notes.push(`Chance de chuva ${p.precipProb}%`); }
        else if ((p.precipProb ?? 0) >= 30) { bump('warn'); flags.probDryWarn++; notes.push(`Chance de chuva ${p.precipProb}%`); }
      }
      if (p.humidity != null && p.humidity >= 90) { bump('warn'); flags.humDryHigh++; notes.push(`Umidade ${p.humidity}%: secagem lenta`); }
      if (p.temp != null && p.temp < 8) { bump('warn'); flags.coldDry++; notes.push(`${fmt1(p.temp)} °C: secagem lenta`); }
    }
    hours.push({ time, phase, level, point: p, notes });
  }

  // Blocos 24/48/72 h depois da aplicação
  const endIdx = cfg.startHour + paintSpan;
  const after: AfterBlock[] = [24, 48, 72].map((n, k) => {
    let maxProb: number | null = null; let mm: number | null = null; let got = 0;
    for (let i = k * 24; i < n; i++) {
      const p = byTime.get(hourIso(cfg.date, endIdx + i));
      if (!p) continue;
      got++;
      if (p.precipProb != null) maxProb = Math.max(maxProb ?? 0, p.precipProb);
      if (p.precip != null) mm = (mm ?? 0) + p.precip;
    }
    const level: Level = got < 12 ? 'none' : (mm ?? 0) >= 1 || (maxProb ?? 0) >= 60 ? 'bad' : (maxProb ?? 0) >= 30 ? 'warn' : 'ok';
    return { label: `${k * 24}–${n} h depois`, maxProb, rainMm: mm == null ? null : Math.round(mm * 10) / 10, level };
  });

  const reasons: Reason[] = [];
  const span = (list: string[]) => (list.length ? `${hh(list[0])}${list.length > 1 ? ` a ${hh(list[list.length - 1])}` : ''}` : '');
  if (flags.rainPaint.length) reasons.push({ level: 'bad', text: `Chuva prevista durante a aplicação (${fmt1(flags.rainPaintMm)} mm, ${span(flags.rainPaint)}).` });
  if (flags.probPaintBad) reasons.push({ level: 'bad', text: `Chance de chuva de 50% ou mais em ${flags.probPaintBad} h da aplicação.` });
  if (flags.probPaintWarn) reasons.push({ level: 'warn', text: ext ? `Chance moderada de chuva (25–49%) em ${flags.probPaintWarn} h da aplicação.` : `Chuva lá fora em ${flags.probPaintWarn} h da aplicação: o ar fica mais úmido e as janelas fechadas.` });
  if (flags.rainDry.length) reasons.push({ level: 'bad', text: `Chuva dentro do período de proteção de ${cfg.protectionH} h (${fmt1(flags.rainDryMm)} mm, a partir de ${hh(flags.rainDry[0])} de ${flags.rainDry[0].slice(8, 10)}/${flags.rainDry[0].slice(5, 7)}).` });
  if (flags.probDryBad) reasons.push({ level: 'bad', text: `Chance de chuva de 60% ou mais em ${flags.probDryBad} h do período de secagem.` });
  if (flags.probDryWarn) reasons.push({ level: 'warn', text: `Chance de chuva de 30–59% em ${flags.probDryWarn} h do período de secagem.` });
  if (flags.cold.length) reasons.push({ level: 'bad', text: `Temperatura abaixo de ${MIN_TEMP} °C durante a aplicação (${span(flags.cold)}).` });
  if (flags.hot.length) reasons.push({ level: 'warn', text: `Acima de ${MAX_TEMP} °C durante a aplicação: risco de emendas e marcas.` });
  if (flags.humBad.length) reasons.push({ level: 'bad', text: `Umidade relativa de ${HUM_BAD}% ou mais em ${flags.humBad.length} h da aplicação.` });
  if (flags.humWarn.length) reasons.push({ level: 'warn', text: `Umidade entre ${humWarnAt}% e ${HUM_BAD - 1}% em ${flags.humWarn.length} h da aplicação.` });
  if (flags.dew.length) reasons.push({ level: flags.dew.length > 2 ? 'bad' : 'warn', text: `Temperatura perto do ponto de orvalho em ${flags.dew.length} h: a parede pode condensar água.` });
  if (flags.windBad) reasons.push({ level: 'bad', text: `Vento acima de 45 km/h em ${flags.windBad} h.` });
  if (flags.windWarn) reasons.push({ level: 'warn', text: `Vento entre 30 e 45 km/h em ${flags.windWarn} h: poeira e secagem desigual.` });
  if (flags.humDryHigh) reasons.push({ level: 'warn', text: `Umidade de 90% ou mais em ${flags.humDryHigh} h da secagem: vai demorar mais que o rótulo promete.` });
  if (flags.coldDry) reasons.push({ level: 'warn', text: `Madrugada abaixo de 8 °C em ${flags.coldDry} h da secagem.` });

  const cautions: string[] = [
    'Sem chuva não significa parede seca: a superfície precisa estar seca, limpa e sem infiltração antes da primeira demão.',
    'Os intervalos usados aqui são os que você informou. A ficha técnica da sua tinta manda.',
  ];
  if (!ext) cautions.push(cfg.ventilation === 'ruim' ? 'Ventilação ruim: considere um ventilador ou desumidificador, e outro dia se a umidade estiver alta.' : 'Mantenha o ambiente ventilado durante a aplicação e a secagem.');
  if (room.wet) cautions.push('Ambiente com vapor: evite banho quente, panela fervendo ou roupa secando no cômodo durante a secagem. Se houver mofo, trate antes com produto adequado e considere tinta com antimofo.');
  if (cfg.room === 'banheiro') cautions.push('Banheiro: o ideal é não usar o chuveiro até completar o período de proteção.');
  if (PAINTS[cfg.paint].internalOnly && ext) reasons.push({ level: 'warn', text: `${PAINTS[cfg.paint].label} não costuma ser indicada para área externa.` });
  if (PAINTS[cfg.paint].internalOnly && room.wet) reasons.push({ level: 'warn', text: `${PAINTS[cfg.paint].label} não costuma ser indicada para ambientes úmidos.` });
  if (cfg.paint === 'esmalte-solvente' || cfg.paint === 'epoxi') cautions.push('Produto com vapores fortes: janelas abertas e máscara adequada.');

  const lead = daysBetween(todayIso, cfg.date);
  const fracMissing = missing / total;
  let verdict: Verdict;
  if (lead < 0) verdict = 'insuficiente';
  else if (fracMissing > 0.25 || missingKey / total > 0.3) verdict = 'insuficiente';
  else if (hours.some((h) => h.level === 'bad') || reasons.some((r) => r.level === 'bad')) verdict = 'desfavoravel';
  else if (hours.some((h) => h.level === 'warn') || reasons.some((r) => r.level === 'warn')) verdict = 'atencao';
  else verdict = 'favoravel';

  if (verdict === 'insuficiente') {
    reasons.unshift({ level: 'info', text: lead < 0 ? 'Essa data já passou.' : `A previsão cobre só ${total - missing} das ${total} horas da janela. Escolha uma data mais próxima ou avalie manualmente.` });
  } else if (verdict === 'favoravel') {
    reasons.unshift({ level: 'ok', text: ext ? 'Sem chuva prevista na aplicação nem nas horas de proteção, com temperatura e umidade dentro da faixa.' : 'Temperatura e umidade dentro da faixa durante a aplicação.' });
  }
  if (missing > 0 && verdict !== 'insuficiente') reasons.push({ level: 'info', text: `${missing} h da janela ficaram fora do alcance da previsão.` });

  let confidence: PaintEvaluation['confidence'];
  if (manual) confidence = { label: 'manual', detail: 'Avaliação com os números que você digitou. Vale o quanto eles valerem.' };
  else if (verdict === 'insuficiente') confidence = { label: 'nenhuma', detail: 'Sem dados suficientes para avaliar.' };
  else if (lead <= 2) confidence = { label: 'alta', detail: `Previsão para daqui a ${lead === 0 ? 'hoje' : lead + ' dia(s)'}: costuma ser confiável, mas ainda é previsão.` };
  else if (lead <= 5) confidence = { label: 'média', detail: `Faltam ${lead} dias: confira de novo na véspera.` };
  else if (lead <= 9) confidence = { label: 'baixa', detail: `Faltam ${lead} dias: use como tendência, não como plano.` };
  else confidence = { label: 'muito baixa', detail: `Faltam ${lead} dias: isso é quase astrologia meteorológica.` };

  return { verdict, confidence, reasons, cautions, hours, after, window: { start, paintEnd, dryEnd, totalH: total }, criteria };
}

/** Pontos sintéticos para a avaliação manual. */
export function manualHours(cfg: PaintConfig, v: { temp: number; humidity: number; rainProb: number; rainExpected: boolean }): HourPoint[] {
  const { total } = windowHours(cfg);
  const out: HourPoint[] = [];
  for (let i = 0; i < total + 72 + 1; i++) {
    out.push({
      time: hourIso(cfg.date, cfg.startHour + i),
      temp: v.temp, humidity: v.humidity, dewPoint: null, precipProb: v.rainProb,
      precip: v.rainExpected ? 1 : 0, code: null, wind: null,
    });
  }
  return out;
}

export const VERDICT_META: Record<Verdict, { label: string; tone: string; line: string }> = {
  favoravel: { label: 'Favorável', tone: 'ok', line: 'Pode separar o rolo.' },
  atencao: { label: 'Atenção', tone: 'warn', line: 'Dá, mas com ressalvas.' },
  desfavoravel: { label: 'Desfavorável', tone: 'bad', line: 'Melhor não. A parede agradece.' },
  insuficiente: { label: 'Dados insuficientes', tone: 'none', line: 'Ninguém sabe ainda. Nem o céu.' },
};
