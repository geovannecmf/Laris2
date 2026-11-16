import { describe, it, expect } from 'vitest';
import { recommend, type BoredFilters } from './recommend';

const base: BoredFilters = { where: 'tanto-faz', company: 'acompanhada', cost: 'livre', time: 'horas', vibe: 'qualquer', space: 'tanto-faz' };

describe('recommend', () => {
  it('respeita casa/rua', () => {
    expect(recommend({ ...base, where: 'casa' }, 'ok').every((s) => s.activity.where === 'casa')).toBe(true);
    expect(recommend({ ...base, where: 'rua' }, 'ok').every((s) => s.activity.where === 'rua')).toBe(true);
  });
  it('respeita orçamento gratuito', () => {
    expect(recommend({ ...base, cost: 'gratis' }, 'ok').every((s) => s.activity.cost === 'gratis')).toBe(true);
  });
  it('respeita a vibe escolhida', () => {
    const r = recommend({ ...base, vibe: 'gastronomico' }, 'ok');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((s) => s.activity.vibes.includes('gastronomico'))).toBe(true);
  });
  it('com chuva, externas ficam bloqueadas e no fim da lista', () => {
    const r = recommend({ ...base, where: 'rua' }, 'bad');
    const ext = r.filter((s) => s.activity.outdoor);
    expect(ext.length).toBeGreaterThan(0);
    expect(ext.every((s) => s.blocked && s.weatherNote)).toBe(true);
    expect(r[0].activity.outdoor).toBe(false);
  });
  it('clima desconhecido sempre avisa nas externas', () => {
    const r = recommend({ ...base, space: 'externa' }, 'unknown');
    expect(r.every((s) => s.weatherNote?.includes('confirmar'))).toBe(true);
  });
  it('15 minutos não sugere passeio de horas', () => {
    expect(recommend({ ...base, time: '15m' }, 'ok').every((s) => s.activity.time.includes('15m'))).toBe(true);
  });
});
