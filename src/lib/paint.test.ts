import { describe, it, expect } from 'vitest';
import { evaluatePaint, defaultConfig, manualHours, type PaintConfig } from './paint';
import type { HourPoint } from './weather';
import { addDays } from './time';

const today = '2026-11-16';
function hours(date: string, days: number, over: (i: number, h: number) => Partial<HourPoint> = () => ({})): HourPoint[] {
  const out: HourPoint[] = [];
  for (let d = 0; d < days; d++) for (let h = 0; h < 24; h++) {
    const i = d * 24 + h;
    out.push({ time: `${addDays(date, d)}T${String(h).padStart(2, '0')}:00`, temp: 22, humidity: 55, dewPoint: 10, precipProb: 5, precip: 0, code: 1, wind: 8, ...over(i, h) });
  }
  return out;
}
const ext: PaintConfig = { ...defaultConfig('2026-11-17'), mode: 'externa', room: 'fachada' };

describe('evaluatePaint', () => {
  it('favorável com tempo seco e ameno', () => {
    const r = evaluatePaint(ext, hours(today, 5), today);
    expect(r.verdict).toBe('favoravel');
    expect(r.confidence.label).toBe('alta');
  });
  it('desfavorável com chuva na secagem externa', () => {
    const r = evaluatePaint(ext, hours(today, 5, (i) => (i === 24 + 20 ? { precip: 2, precipProb: 80 } : {})), today);
    expect(r.verdict).toBe('desfavoravel');
    expect(r.reasons.some((x) => x.text.includes('proteção'))).toBe(true);
  });
  it('chuva lá fora é só atenção para pintura interna', () => {
    const cfg = { ...defaultConfig('2026-11-17') };
    const r = evaluatePaint(cfg, hours(today, 5, (i) => (i === 24 + 10 ? { precip: 3, precipProb: 90 } : {})), today);
    expect(r.verdict).toBe('atencao');
  });
  it('umidade alta reprova inclusive interna', () => {
    const r = evaluatePaint(defaultConfig('2026-11-17'), hours(today, 5, () => ({ humidity: 92 })), today);
    expect(r.verdict).toBe('desfavoravel');
  });
  it('frio abaixo de 10 °C reprova', () => {
    const r = evaluatePaint(ext, hours(today, 5, () => ({ temp: 7, dewPoint: 0 })), today);
    expect(r.verdict).toBe('desfavoravel');
  });
  it('dados insuficientes fora do alcance da previsão', () => {
    const r = evaluatePaint({ ...ext, date: '2026-12-20' }, hours(today, 16), today);
    expect(r.verdict).toBe('insuficiente');
  });
  it('banheiro sempre traz alerta de vapor/mofo', () => {
    const r = evaluatePaint({ ...defaultConfig('2026-11-17'), room: 'banheiro' }, hours(today, 5), today);
    expect(r.cautions.join(' ')).toMatch(/mofo/);
    expect(r.cautions.join(' ')).toMatch(/chuveiro/);
  });
  it('nunca omite o aviso de que ausência de chuva não garante secagem', () => {
    const r = evaluatePaint(ext, hours(today, 5), today);
    expect(r.cautions[0]).toMatch(/Sem chuva não significa/);
  });
  it('confiança baixa para datas distantes', () => {
    const r = evaluatePaint({ ...ext, date: '2026-11-24' }, hours(today, 16), today);
    expect(r.confidence.label).toBe('baixa');
  });
  it('janela considera demãos e intervalo', () => {
    const r = evaluatePaint({ ...ext, coats: 3, coatIntervalH: 4, coatDurationH: 2, protectionH: 24 }, hours(today, 5), today);
    expect(r.window.totalH).toBe(2 * 4 + 2 + 24);
    expect(r.hours.filter((h) => h.phase === 'aplicacao')).toHaveLength(10);
  });
  it('avaliação manual marca confiança manual', () => {
    const cfg = { ...ext };
    const r = evaluatePaint(cfg, manualHours(cfg, { temp: 20, humidity: 60, rainProb: 10, rainExpected: false }), today, true);
    expect(r.verdict).toBe('favoravel');
    expect(r.confidence.label).toBe('manual');
  });
});
