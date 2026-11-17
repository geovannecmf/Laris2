import { useMemo, useState } from 'react';
import { Search, Plus, Trash2, Star, Target, ExternalLink, Info, Megaphone } from 'lucide-react';
import { ModuleHeader, SourceBadge, Empty, ExtLink, Seg } from '../components/ui';
import { useApp } from '../components/AppState';
import { useStored, uid } from '../lib/storage';
import { spNow, addDays, fmtDateTime, fmtDay } from '../lib/time';
import { ORIGINS, DESTS, searchLinks, validateOffer, brl, type Origin, type Dest, type Offer } from '../lib/flights';

interface Query { origins: Origin[]; dests: Dest[]; depart: string; ret: string; oneWay: boolean; adults: number; budget: number | null }

function RouteMap({ origins, dests }: { origins: Origin[]; dests: Dest[] }) {
  // Projeção equiretangular centrada no Pacífico (lon -120): NZ à esquerda, Brasil à direita.
  const W = 600, H = 250;
  const pt = (lon: number, lat: number) => {
    const rel = ((lon + 120 + 540) % 360) - 180;
    return [((rel + 180) / 360) * W * 1.25 - W * 0.12, 24 + (-lat / 55) * (H - 48)] as const;
  };
  const O: Record<Origin, readonly [number, number]> = { CWB: pt(-49.17, -25.53), GRU: pt(-46.47, -23.43) };
  const D: Record<Dest, readonly [number, number]> = { AKL: pt(174.79, -37.01), WLG: pt(174.8, -41.33), CHC: pt(172.53, -43.49) };
  const DY: Record<Dest, number> = { AKL: -8, WLG: 4, CHC: 16 };
  const arcs = origins.flatMap((o) => dests.map((d) => ({ o, d })));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Mapa ilustrativo: de ${origins.join(' e ')} até ${dests.map((d) => DESTS[d].name).join(', ')}, atravessando o Pacífico`}>
      <defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="white" opacity="0.22" /></pattern></defs>
      <rect width={W} height={H} fill="url(#dots)" />
      <text x={pt(-60, -10)[0]} y={pt(-60, -10)[1]} fill="white" opacity="0.45" fontSize="12" fontWeight="700" textAnchor="middle">América do Sul</text>
      <text x={pt(150, -22)[0]} y={pt(150, -22)[1]} fill="white" opacity="0.45" fontSize="12" fontWeight="700" textAnchor="middle">Oceania</text>
      <text x={W / 2} y={H - 10} fill="white" opacity="0.55" fontSize="11" fontWeight="700" textAnchor="middle">Oceano Pacífico · traçado ilustrativo, não é a rota real do voo</text>
      {arcs.map(({ o, d }, i) => {
        const [x1, y1] = O[o]; const [x2, y2] = D[d];
        const cy = Math.min(y1, y2) + 80 + i * 8;
        return <path key={o + d} d={`M${x1},${y1} Q${(x1 + x2) / 2},${cy} ${x2},${y2}`} fill="none" stroke="rgb(var(--ipe))" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />;
      })}
      {(Object.keys(O) as Origin[]).map((o) => (
        <g key={o} opacity={origins.includes(o) ? 1 : 0.35}>
          <circle cx={O[o][0]} cy={O[o][1]} r="6" fill="rgb(var(--ipe))" stroke="#1C252D" strokeWidth="2" />
          <text x={O[o][0] + 10} y={O[o][1] + (o === 'GRU' ? -4 : 14)} fill="white" fontSize="14" fontWeight="800">{o}</text>
        </g>
      ))}
      {(Object.keys(D) as Dest[]).map((d) => (
        <g key={d} opacity={dests.includes(d) ? 1 : 0.35}>
          <circle cx={D[d][0]} cy={D[d][1]} r="5" fill="white" stroke="#1C252D" strokeWidth="2" />
          <text x={D[d][0] - 10} y={D[d][1] + DY[d]} textAnchor="end" fill="white" fontSize="13" fontWeight="800">{d}</text>
        </g>
      ))}
    </svg>
  );
}

function PriceChart({ offers, target }: { offers: Offer[]; target: number | null }) {
  const pts = [...offers].sort((a, b) => a.checkedAt - b.checkedAt);
  if (pts.length < 2) return <p className="text-sm text-muted">Registre pelo menos duas ofertas para ver o histórico.</p>;
  const W = 560, H = 180, P = 32;
  const prices = pts.map((o) => o.priceTotal / o.adults);
  const all = target ? [...prices, target] : prices;
  const min = Math.min(...all) * 0.95, max = Math.max(...all) * 1.05;
  const t0 = pts[0].checkedAt, t1 = pts[pts.length - 1].checkedAt || t0 + 1;
  const x = (t: number) => P + ((t - t0) / Math.max(1, t1 - t0)) * (W - P * 2);
  const y = (v: number) => H - P - ((v - min) / Math.max(1, max - min)) * (H - P * 2);
  const d = pts.map((o, i) => `${i ? 'L' : 'M'}${x(o.checkedAt).toFixed(1)},${y(prices[i]).toFixed(1)}`).join(' ');
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Histórico de ${pts.length} preços registrados, por pessoa, de ${brl(Math.min(...prices))} a ${brl(Math.max(...prices))}`}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="currentColor" strokeOpacity="0.2" />
        {target && <g><line x1={P} x2={W - P} y1={y(target)} y2={y(target)} stroke="rgb(var(--ok))" strokeDasharray="6 5" strokeWidth="2" /><text x={W - P} y={y(target) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="rgb(var(--ok))">meta {brl(target)}</text></g>}
        <path d={d} fill="none" stroke="rgb(var(--mar))" strokeWidth="3" strokeLinejoin="round" />
        {pts.map((o, i) => <circle key={o.id} cx={x(o.checkedAt)} cy={y(prices[i])} r="5" fill="rgb(var(--surface))" stroke="rgb(var(--mar))" strokeWidth="3"><title>{`${brl(prices[i])} por pessoa, ${o.source}, ${fmtDateTime(o.checkedAt)}`}</title></circle>)}
        <text x={P} y={16} fontSize="11" fontWeight="700" fill="currentColor" opacity="0.6">{brl(max)}</text>
        <text x={P} y={H - 8} fontSize="11" fontWeight="700" fill="currentColor" opacity="0.6">{brl(min)}</text>
      </svg>
      <figcaption className="text-xs text-muted">Preço por pessoa ao longo das suas consultas. Dados registrados manualmente por você.</figcaption>
    </figure>
  );
}

export default function NewZealand() {
  const { toast, unlock } = useApp();
  const today = spNow().date;
  const [q, setQ] = useStored<Query>('nz-query', { origins: ['GRU'], dests: ['AKL'], depart: addDays(today, 120), ret: addDays(today, 140), oneWay: false, adults: 2, budget: null });
  const [offers, setOffers] = useStored<Offer[]>('nz-offers', []);
  const [favs, setFavs] = useStored<string[]>('nz-favs', []);
  const [target, setTarget] = useStored<number | null>('nz-target', null);
  const [form, setForm] = useState({ origin: q.origins[0] ?? 'GRU', dest: q.dests[0] ?? 'AKL', price: '', source: '', url: '', airline: '', stops: '', duration: '', note: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState<'todas' | 'favoritas'>('todas');
  const [targetDraft, setTargetDraft] = useState(target ? String(target) : '');

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? (arr.length > 1 ? arr.filter((x) => x !== v) : arr) : [...arr, v]);
  const combos = q.origins.flatMap((o) => q.dests.map((d) => ({ o, d })));
  const dateErr = !q.depart ? 'Escolha a data de ida.' : q.depart < today ? 'A ida já passou.' : !q.oneWay && q.ret && q.ret < q.depart ? 'A volta está antes da ida.' : null;

  const sorted = useMemo(() => [...offers].filter((o) => filter === 'todas' || favs.includes(o.id)).sort((a, b) => a.priceTotal / a.adults - b.priceTotal / b.adults), [offers, favs, filter]);
  const best = sorted[0];
  const bestPP = offers.length ? Math.min(...offers.map((o) => o.priceTotal / o.adults)) : null;

  const addOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const o: Offer = {
      id: uid(), origin: form.origin, dest: form.dest, depart: q.depart, ret: q.oneWay ? '' : q.ret, adults: q.adults,
      priceTotal: Number(form.price.replace(/\./g, '').replace(',', '.')), source: form.source.trim(), url: form.url.trim() || undefined,
      airline: form.airline.trim() || undefined, stops: form.stops === '' ? null : Number(form.stops), durationH: form.duration === '' ? null : Number(form.duration.replace(',', '.')),
      checkedAt: Date.now(), note: form.note.trim() || undefined,
    };
    const errs = validateOffer(o);
    setErrors(errs);
    if (errs.length) return;
    setOffers((p) => [...p, o]);
    setForm((f) => ({ ...f, price: '', url: '', airline: '', stops: '', duration: '', note: '' }));
    toast('Oferta registrada', 'ok', `${brl(o.priceTotal)} em ${o.source}`);
    unlock('nz-offer');
    if (target && o.priceTotal / o.adults <= target) toast('Bateu a meta!', 'trophy', 'Essa oferta está abaixo do seu preço-alvo por pessoa.');
  };

  return (
    <div>
      <ModuleHeader code="AT-02" name="Azul Mar da Tasmânia" color="mar" title="Missão Nova Zelândia" lead="Pesquise nos buscadores de verdade, registre o que encontrar e acompanhe sua meta. Aqui ninguém inventa promoção: o preço que aparece é o que você viu, com data e fonte.">
        <div className="mt-3 flex flex-wrap gap-2"><SourceBadge kind="manual" label="Preços: registrados por você" /><span className="tag bg-sunk text-muted">Sem API de tarifas conectada</span></div>
      </ModuleHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="chip overflow-hidden" aria-labelledby="busca">
          <div className="bg-[#0B4F57] p-3 dark:bg-[#0a3b42]"><RouteMap origins={q.origins} dests={q.dests} /></div>
          <form className="space-y-4 p-5" onSubmit={(e) => e.preventDefault()}>
            <h2 id="busca" className="font-display text-xl font-bold">Planejar a busca</h2>
            <fieldset><legend className="label">Saindo de</legend>
              <div className="flex flex-wrap gap-2">{(Object.keys(ORIGINS) as Origin[]).map((o) => <button key={o} type="button" className="pill" aria-pressed={q.origins.includes(o)} onClick={() => setQ({ ...q, origins: toggle(q.origins, o) })}>{o} <span className="font-normal opacity-80">{ORIGINS[o]}</span></button>)}</div>
            </fieldset>
            <fieldset><legend className="label">Chegando em</legend>
              <div className="flex flex-wrap gap-2">{(Object.keys(DESTS) as Dest[]).map((d) => <button key={d} type="button" className="pill" aria-pressed={q.dests.includes(d)} onClick={() => setQ({ ...q, dests: toggle(q.dests, d) })}>{d} <span className="font-normal opacity-80">{DESTS[d].name}</span></button>)}</div>
              <p className="mt-1 text-xs text-muted">Marque vários para comparar aeroportos.</p>
            </fieldset>
            <Seg label="Tipo de viagem" value={q.oneWay ? 'ida' : 'idavolta'} onChange={(v) => setQ({ ...q, oneWay: v === 'ida' })} options={[{ v: 'idavolta', l: 'Ida e volta' }, { v: 'ida', l: 'Só ida' }]} />
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="dep" className="label">Ida</label><input id="dep" type="date" className="field" min={today} value={q.depart} onChange={(e) => setQ({ ...q, depart: e.target.value })} /></div>
              {!q.oneWay && <div><label htmlFor="ret" className="label">Volta</label><input id="ret" type="date" className="field" min={q.depart || today} value={q.ret} onChange={(e) => setQ({ ...q, ret: e.target.value })} /></div>}
              <div><label htmlFor="pax" className="label">Passageiros</label><input id="pax" type="number" min={1} max={9} className="field" value={q.adults} onChange={(e) => setQ({ ...q, adults: Math.max(1, Math.min(9, Number(e.target.value) || 1)) })} /></div>
              <div><label htmlFor="bud" className="label">Orçamento total</label><input id="bud" type="number" min={0} step={100} inputMode="numeric" placeholder="R$" className="field" value={q.budget ?? ''} onChange={(e) => setQ({ ...q, budget: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            {dateErr && <p role="alert" className="text-sm font-bold text-bad">{dateErr}</p>}
          </form>
        </section>

        <section aria-labelledby="links" className="space-y-4">
          <div className="chip p-5">
            <h2 id="links" className="flex items-center gap-2 font-display text-xl font-bold"><Search size={20} aria-hidden />Pesquisar nos buscadores</h2>
            <p className="mt-1 text-sm text-muted">Cada botão abre a busca já preenchida, em nova aba. Preço, escalas e duração reais você vê lá.</p>
            <ul className="mt-4 space-y-3">
              {combos.map(({ o, d }) => (
                <li key={o + d} className="rounded-xl border-2 border-ink/15 p-3">
                  <p className="font-display font-bold">{o} → {d} <span className="font-body text-sm font-normal text-muted">{DESTS[d].name}{q.depart && `, ${fmtDay(q.depart, 'short')}`}{!q.oneWay && q.ret && ` a ${fmtDay(q.ret, 'short')}`}, {q.adults} pax</span></p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searchLinks({ origin: o, dest: d, depart: q.depart, ret: q.ret, adults: q.adults, oneWay: q.oneWay }).map((l) => (
                      dateErr ? <span key={l.id} className="btn-outline !min-h-[40px] cursor-not-allowed opacity-50" aria-disabled>{l.name}</span> :
                      <ExtLink key={l.id} href={l.url} className="btn-outline !min-h-[40px] text-sm">{l.name}</ExtLink>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="chip p-5">
            <h3 className="flex items-center gap-2 font-display font-bold"><Info size={18} aria-hidden />Antes de comparar</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>Não há voo direto entre o Brasil e a Nova Zelândia. As rotas costumam ter conexão na América do Sul (como Santiago), na Austrália, no Oriente Médio ou na América do Norte — confirme no buscador.</li>
              <li>A viagem total costuma passar de um dia inteiro, contando conexões. Veja a duração real de cada opção.</li>
              <li>Brasileiros precisam verificar as regras de entrada (como a NZeTA) no site oficial do governo neozelandês antes de comprar.</li>
              <li>Verão por lá: dezembro a fevereiro. Inverno: junho a agosto.</li>
            </ul>
            <ExtLink href="https://www.immigration.govt.nz/" className="btn-ghost mt-2 !px-2 text-sm">Imigração da Nova Zelândia</ExtLink>
          </div>
        </section>
      </div>

      {/* Meta + registro */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="space-y-6">
          <div className="chip p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Target size={20} aria-hidden />Meta de preço por pessoa</h2>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(targetDraft); if (n > 0) { setTarget(n); unlock('nz-goal'); toast('Meta salva', 'ok', brl(n) + ' por pessoa'); } else { setTarget(null); toast('Meta removida', 'info'); } }}>
              <label htmlFor="tgt" className="sr-only">Meta em reais por pessoa</label>
              <input id="tgt" type="number" min={0} step={100} inputMode="numeric" placeholder="Ex.: 7000" className="field" value={targetDraft} onChange={(e) => setTargetDraft(e.target.value)} />
              <button className="btn-primary shrink-0">Salvar meta</button>
            </form>
            {target && (
              <div className="mt-4">
                {bestPP == null ? <p className="text-sm text-muted">Registre ofertas para acompanhar a distância até a meta.</p> : (
                  <>
                    <div className="flex items-end justify-between text-sm"><span>Melhor registrada: <b>{brl(bestPP)}</b></span><span>Meta: <b>{brl(target)}</b></span></div>
                    <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-ink bg-sunk" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(100, (target / bestPP) * 100))} aria-label="Proximidade da meta">
                      <div className={`h-full ${bestPP <= target ? 'bg-ok' : 'bg-mar'}`} style={{ width: `${Math.min(100, (target / bestPP) * 100)}%` }} />
                    </div>
                    <p className="mt-2 font-bold">{bestPP <= target ? 'Meta alcançada. Agora é coragem.' : `Faltam ${brl(bestPP - target)} por pessoa.`}</p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="chip p-5">
            <h2 className="font-display text-xl font-bold">Histórico de preços</h2>
            <div className="mt-3"><PriceChart offers={offers} target={target} /></div>
          </div>
          <aside className="rounded-2xl border-2 border-dashed border-ink/30 p-4 text-sm text-muted" aria-label="Espaço publicitário">
            <p className="flex items-center gap-2 font-bold text-ink"><Megaphone size={16} aria-hidden />Espaço para ofertas patrocinadas</p>
            <p className="mt-1">Reservado para uma futura parceria com fonte real e identificada. Hoje não há nenhum anúncio ativo — e nenhum será inventado.</p>
          </aside>
        </section>

        <section className="chip p-5" aria-labelledby="reg">
          <h2 id="reg" className="flex items-center gap-2 font-display text-xl font-bold"><Plus size={20} aria-hidden />Registrar oferta encontrada</h2>
          <p className="mt-1 text-sm text-muted">Usa as datas e passageiros da busca acima. Data e hora do registro são salvas automaticamente.</p>
          <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={addOffer} noValidate>
            <div><label className="label" htmlFor="f-o">Origem</label><select id="f-o" className="field" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as Origin })}>{(Object.keys(ORIGINS) as Origin[]).map((o) => <option key={o}>{o}</option>)}</select></div>
            <div><label className="label" htmlFor="f-d">Destino</label><select id="f-d" className="field" value={form.dest} onChange={(e) => setForm({ ...form, dest: e.target.value as Dest })}>{(Object.keys(DESTS) as Dest[]).map((d) => <option key={d}>{d}</option>)}</select></div>
            <div><label className="label" htmlFor="f-p">Preço total (R$)*</label><input id="f-p" required inputMode="decimal" className="field" placeholder="Ex.: 14.980" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="label" htmlFor="f-s">Onde viu*</label><input id="f-s" required list="fontes" className="field" placeholder="Ex.: Google Voos" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              <datalist id="fontes"><option>Google Voos</option><option>Skyscanner</option><option>Kayak</option><option>Momondo</option><option>Site da companhia aérea</option></datalist></div>
            <div className="col-span-2"><label className="label" htmlFor="f-u">Link da oferta</label><input id="f-u" type="url" className="field" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} /></div>
            <div><label className="label" htmlFor="f-a">Companhia(s)</label><input id="f-a" className="field" value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label" htmlFor="f-st">Escalas</label><input id="f-st" type="number" min={0} max={5} className="field" value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} /></div>
              <div><label className="label" htmlFor="f-du">Horas</label><input id="f-du" inputMode="decimal" className="field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            </div>
            <div className="col-span-2"><label className="label" htmlFor="f-n">Observação</label><input id="f-n" className="field" placeholder="Bagagem inclusa? Tarifa reembolsável?" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            {errors.length > 0 && <ul role="alert" className="col-span-2 list-disc pl-5 text-sm font-bold text-bad">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
            <button className="btn-primary col-span-2">Registrar oferta</button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold">Comparador ({offers.length})</h3>
            <Seg label="Filtrar ofertas" value={filter} onChange={setFilter} options={[{ v: 'todas', l: 'Todas' }, { v: 'favoritas', l: 'Favoritas' }]} />
          </div>
          {sorted.length === 0 ? (
            <div className="mt-3"><Empty title={filter === 'favoritas' ? 'Nenhuma favorita ainda' : 'Nada registrado ainda'} text="Abra um buscador, encontre um preço que valha a pena e registre aqui para comparar depois." /></div>
          ) : (
            <ul className="mt-3 space-y-2">
              {sorted.map((o) => {
                const pp = o.priceTotal / o.adults;
                const over = q.budget != null && o.priceTotal > q.budget;
                const age = (Date.now() - o.checkedAt) / 86400000;
                return (
                  <li key={o.id} className={`rounded-xl border-2 p-3 ${o.id === best?.id ? 'border-ok' : 'border-ink/15'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-xl font-extrabold">{brl(o.priceTotal)} <span className="font-body text-sm font-normal text-muted">({brl(pp)}/pessoa)</span></p>
                        <p className="text-sm font-bold">{o.origin} → {o.dest} · {fmtDay(o.depart, 'short')}{o.ret && ` a ${fmtDay(o.ret, 'short')}`} · {o.adults} pax</p>
                        <p className="text-sm text-muted">{o.source}{o.airline && `, ${o.airline}`}{o.stops != null && `, ${o.stops} escala(s)`}{o.durationH != null && `, ${o.durationH} h`}</p>
                        <p className="text-xs text-muted">Consultado em {fmtDateTime(o.checkedAt)}{age > 2 && ' — preço provavelmente já mudou'}</p>
                        {o.note && <p className="mt-1 text-sm">{o.note}</p>}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {o.id === best?.id && <span className="tag bg-ok/15 text-ok">Mais barata</span>}
                          {over && <span className="tag bg-bad/15 text-bad">Acima do orçamento</span>}
                          {target && pp <= target && <span className="tag bg-ipe/30 text-ink">Dentro da meta</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button className={`grid h-10 w-10 place-items-center rounded-lg border-2 ${favs.includes(o.id) ? 'border-ipe bg-ipe text-[#1C252D]' : 'border-ink/20'}`} aria-pressed={favs.includes(o.id)} aria-label="Favoritar oferta" onClick={() => { setFavs((f) => (f.includes(o.id) ? f.filter((x) => x !== o.id) : [...f, o.id])); unlock('fav'); }}><Star size={16} fill={favs.includes(o.id) ? 'currentColor' : 'none'} /></button>
                        {o.url && <a className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink/20" href={o.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir oferta"><ExternalLink size={16} /></a>}
                        <button className="grid h-10 w-10 place-items-center rounded-lg border-2 border-ink/20 text-bad" aria-label="Excluir oferta" onClick={() => { if (confirm('Excluir esta oferta?')) setOffers((p) => p.filter((x) => x.id !== o.id)); }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
