export type Origin = 'CWB' | 'GRU';
export type Dest = 'AKL' | 'WLG' | 'CHC';

export const ORIGINS: Record<Origin, string> = { CWB: 'Curitiba (Afonso Pena)', GRU: 'São Paulo (Guarulhos)' };
export const DESTS: Record<Dest, { name: string; blurb: string; x: number; y: number }> = {
  AKL: { name: 'Auckland', blurb: 'Maior aeroporto do país e porta de entrada mais comum.', x: 0.946, y: 0.68 },
  WLG: { name: 'Wellington', blurb: 'A capital. Vento, café e ladeiras.', x: 0.952, y: 0.735 },
  CHC: { name: 'Christchurch', blurb: 'Ilha Sul: base para os Alpes do Sul.', x: 0.94, y: 0.76 },
};

export interface FlightQuery { origin: Origin; dest: Dest; depart: string; ret: string; adults: number; oneWay?: boolean }

const yymmdd = (iso: string) => iso.slice(2).replace(/-/g, '');

export function searchLinks(q: FlightQuery) {
  const n = Math.max(1, Math.min(9, q.adults));
  const o = q.origin, d = q.dest;
  const gText = `Voos de ${o} para ${d} em ${q.depart}${q.oneWay || !q.ret ? ' somente ida' : ` volta ${q.ret}`} ${n} adultos`;
  return [
    { id: 'google', name: 'Google Voos', url: `https://www.google.com/travel/flights?hl=pt-BR&curr=BRL&q=${encodeURIComponent(gText)}` },
    { id: 'skyscanner', name: 'Skyscanner', url: `https://www.skyscanner.com.br/transport/flights/${o.toLowerCase()}/${d.toLowerCase()}/${yymmdd(q.depart)}/${q.oneWay || !q.ret ? '' : yymmdd(q.ret) + '/'}?adultsv2=${n}&cabinclass=economy` },
    { id: 'kayak', name: 'Kayak', url: `https://www.kayak.com.br/flights/${o}-${d}/${q.depart}${q.oneWay || !q.ret ? '' : '/' + q.ret}/${n}adults?sort=price_a` },
    { id: 'momondo', name: 'Momondo', url: `https://www.momondo.com.br/flight-search/${o}-${d}/${q.depart}${q.oneWay || !q.ret ? '' : '/' + q.ret}/${n}adults?sort=price_a` },
  ];
}

export interface Offer {
  id: string;
  origin: Origin;
  dest: Dest;
  depart: string;
  ret: string;
  adults: number;
  priceTotal: number; // BRL, total para todos os passageiros
  source: string; // ex.: "Google Voos"
  url?: string;
  airline?: string;
  stops?: number | null;
  durationH?: number | null;
  checkedAt: number; // momento em que a pessoa registrou a consulta
  note?: string;
}

export function validateOffer(o: Partial<Offer>): string[] {
  const errs: string[] = [];
  if (!o.priceTotal || !(o.priceTotal > 0)) errs.push('Informe o preço total que você viu (maior que zero).');
  if (o.priceTotal && o.priceTotal > 500000) errs.push('Esse preço parece digitado errado.');
  if (!o.source || !o.source.trim()) errs.push('Diga onde encontrou a oferta.');
  if (!o.depart) errs.push('Informe a data de ida.');
  if (o.ret && o.depart && o.ret < o.depart) errs.push('A volta não pode ser antes da ida.');
  if (o.url && !/^https?:\/\//i.test(o.url)) errs.push('O link precisa começar com http:// ou https://');
  return errs;
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
