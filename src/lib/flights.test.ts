import { describe, it, expect } from 'vitest';
import { searchLinks, validateOffer } from './flights';

describe('searchLinks', () => {
  it('gera links com aeroportos, datas e passageiros', () => {
    const l = searchLinks({ origin: 'GRU', dest: 'AKL', depart: '2027-03-01', ret: '2027-03-20', adults: 2 });
    const sky = l.find((x) => x.id === 'skyscanner')!.url;
    expect(sky).toContain('/gru/akl/270301/270320/');
    expect(sky).toContain('adultsv2=2');
    expect(l.find((x) => x.id === 'kayak')!.url).toContain('GRU-AKL/2027-03-01/2027-03-20/2adults');
    l.forEach((x) => expect(() => new URL(x.url)).not.toThrow());
  });
  it('somente ida omite a volta', () => {
    const l = searchLinks({ origin: 'CWB', dest: 'CHC', depart: '2027-03-01', ret: '', adults: 1, oneWay: true });
    expect(l.find((x) => x.id === 'kayak')!.url).toContain('CWB-CHC/2027-03-01/1adults');
  });
});
describe('validateOffer', () => {
  it('exige preço e fonte', () => {
    expect(validateOffer({ depart: '2027-01-01' })).toHaveLength(2);
    expect(validateOffer({ priceTotal: 9000, source: 'Kayak', depart: '2027-01-01', ret: '2027-01-10' })).toHaveLength(0);
  });
  it('rejeita volta antes da ida e link inválido', () => {
    expect(validateOffer({ priceTotal: 9000, source: 'x', depart: '2027-01-10', ret: '2027-01-01', url: 'ftp://a' })).toHaveLength(2);
  });
});
