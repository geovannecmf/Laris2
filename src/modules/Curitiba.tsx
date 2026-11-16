import { useMemo, useState } from 'react';
import { Search, MapPin, Shuffle, Route, CloudRain, Heart, Sparkles, X } from 'lucide-react';
import { ModuleHeader, SourceBadge, ExtLink, FavButton, Empty, Sheet, Seg, ShareButton, whatsappUrl } from '../components/ui';
import { useApp } from '../components/AppState';
import { useIdSet } from '../lib/storage';
import { PLACES, CAT_LABEL, BUDGET_LABEL, mapsUrl, type Place, type PlaceCat, type Budget, type Region } from '../data/curitiba';

const BUDGET_RANK: Record<Budget, number> = { gratis: 0, economico: 1, medio: 2, livre: 3 };
const REGIONS: (Region | 'Todas')[] = ['Todas', 'Centro', 'Norte', 'Sul', 'Leste', 'Oeste', 'Várias'];

/** Gera um roteiro coerente: começa ao ar livre (se o tempo deixa), passa por algo cultural e termina comendo. */
export function buildRoute(pool: Place[], opts: { rain: boolean; budget: Budget; period: 'manha' | 'tarde' | 'noite' }, rnd = Math.random): Place[] {
  const ok = pool.filter((p) => BUDGET_RANK[p.budget] <= BUDGET_RANK[opts.budget] && (!opts.rain || p.indoor));
  const take = (pred: (p: Place) => boolean, used: Place[]) => {
    const c = ok.filter((p) => pred(p) && !used.includes(p));
    return c.length ? c[Math.floor(rnd() * c.length)] : null;
  };
  const r: Place[] = [];
  const steps: ((p: Place) => boolean)[] = opts.period === 'noite'
    ? [(p) => p.period.includes('noite') && (p.cats.includes('teatro') || p.cats.includes('cultura') || p.cats.includes('jogos')), (p) => p.period.includes('noite') && p.cats.includes('restaurantes')]
    : [
      (p) => p.period.includes(opts.period) && (p.cats.includes('natureza') || p.cats.includes('diferentes') || (opts.rain && p.cats.includes('museus'))),
      (p) => p.cats.includes('museus') || p.cats.includes('cultura') || p.cats.includes('diferentes'),
      (p) => p.cats.includes('cafes') || p.cats.includes('restaurantes'),
    ];
  for (const s of steps) { const x = take(s, r); if (x) r.push(x); }
  return r;
}

export default function Curitiba() {
  const { outlook, unlock, toast } = useApp();
  const favs = useIdSet('places-favs');
  const [q, setQ] = useState('');
  const [cats, setCats] = useState<PlaceCat[]>([]);
  const [budget, setBudget] = useState<Budget>('livre');
  const [region, setRegion] = useState<Region | 'Todas'>('Todas');
  const [weatherMode, setWeatherMode] = useState<'auto' | 'coberto' | 'livre'>('auto');
  const [onlyFav, setOnlyFav] = useState(false);
  const [open, setOpen] = useState<Place | null>(null);
  const [route, setRoute] = useState<Place[] | null>(null);
  const [period, setPeriod] = useState<'manha' | 'tarde' | 'noite'>('tarde');

  const rainNow = outlook.status === 'bad';
  const coveredOnly = weatherMode === 'coberto' || (weatherMode === 'auto' && rainNow);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return PLACES.filter((p) => {
      if (onlyFav && !favs.has(p.id)) return false;
      if (cats.length && !cats.some((c) => p.cats.includes(c))) return false;
      if (BUDGET_RANK[p.budget] > BUDGET_RANK[budget]) return false;
      if (region !== 'Todas' && p.region !== region) return false;
      if (coveredOnly && !p.indoor) return false;
      if (term) {
        const hay = `${p.name} ${p.blurb} ${p.bairro ?? ''} ${p.cats.map((c) => CAT_LABEL[c]).join(' ')}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [q, cats, budget, region, coveredOnly, onlyFav, favs]);

  const surprise = () => {
    const pool = list.length ? list : PLACES.filter((p) => !rainNow || p.indoor);
    setOpen(pool[Math.floor(Math.random() * pool.length)]);
  };
  const makeRoute = () => {
    const r = buildRoute(PLACES, { rain: rainNow || weatherMode === 'coberto', budget, period });
    setRoute(r);
    unlock('route');
  };
  const toggleCat = (c: PlaceCat) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const clear = () => { setQ(''); setCats([]); setBudget('livre'); setRegion('Todas'); setWeatherMode('auto'); setOnlyFav(false); };

  return (
    <div>
      <ModuleHeader code="AT-04" name="Verde Araucária" color="arauc" title="O que fazer em Curitiba?" lead="Parques, museus, teatros, cafés e programas para dia de garoa. Curadoria editorial de lugares conhecidos, com o mapa a um toque. Horários mudam: confirme antes de sair.">
        <div className="mt-3 flex flex-wrap gap-2">
          <SourceBadge kind="editorial" label="Curadoria editorial, sem confirmação de funcionamento atual" />
          {outlook.status !== 'unknown' && <span className={`tag ${rainNow ? 'bg-mar/15 text-mar' : 'bg-ok/15 text-ok'}`}><CloudRain size={12} aria-hidden />{rainNow ? 'Chuva prevista: mostrando lugares cobertos' : 'Sem chuva prevista nas próximas horas'}</span>}
        </div>
      </ModuleHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <button className="btn-primary min-h-[56px] text-lg" onClick={surprise}><Sparkles size={18} />Me surpreenda</button>
        <button className="btn-dark min-h-[56px]" onClick={makeRoute}><Route size={18} />Gerar roteiro</button>
        <div className="flex items-center justify-center"><Seg label="Período do roteiro" value={period} onChange={setPeriod} options={[{ v: 'manha', l: 'Manhã' }, { v: 'tarde', l: 'Tarde' }, { v: 'noite', l: 'Noite' }]} /></div>
      </div>

      {route && (
        <section className="chip anim-pop mb-6 overflow-hidden" aria-labelledby="rot">
          <div className="flex items-center justify-between bg-arauc px-5 py-3 text-white">
            <h2 id="rot" className="font-display text-xl font-bold">Roteiro de {period === 'manha' ? 'manhã' : period}</h2>
            <button className="grid h-10 w-10 place-items-center rounded-lg" onClick={() => setRoute(null)} aria-label="Fechar roteiro"><X size={18} /></button>
          </div>
          {route.length ? (
            <ol className="relative space-y-4 p-5">
              {route.map((p, i) => (
                <li key={p.id} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-ipe font-display font-extrabold text-[#1C252D]">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-display font-bold">{p.name}</p>
                    <p className="text-sm text-muted">{p.blurb}</p>
                    <ExtLink href={mapsUrl(p.maps)} className="btn-ghost !min-h-[36px] !px-1 text-sm"><MapPin size={14} />Mapa</ExtLink>
                  </div>
                </li>
              ))}
            </ol>
          ) : <div className="p-5"><Empty title="Não fechou um roteiro" text="Com esse orçamento e clima não encontrei paradas suficientes. Aumente o orçamento ou mude o período." /></div>}
          {route.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t-2 border-ink/10 p-4">
              <button className="btn-outline" onClick={makeRoute}><Shuffle size={16} />Outro roteiro</button>
              <ShareButton title="Roteiro em Curitiba" text={`Roteiro antitédio: ${route.map((p, i) => `${i + 1}. ${p.name}`).join(' · ')}`} onDone={(r) => r === 'copied' && toast('Roteiro copiado')} />
              <ExtLink href={whatsappUrl(`Bora? ${route.map((p, i) => `${i + 1}. ${p.name}`).join(', ')}`)} className="btn-ghost">WhatsApp</ExtLink>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="chip h-fit space-y-4 p-4 lg:sticky lg:top-6" aria-label="Filtros">
          <div className="relative">
            <label htmlFor="pq" className="sr-only">Buscar lugares</label>
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input id="pq" type="search" className="field pl-10" placeholder="Buscar: museu, café, pôr do sol…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <fieldset><legend className="label">Categorias</legend>
            <div className="flex flex-wrap gap-1.5">{(Object.keys(CAT_LABEL) as PlaceCat[]).map((c) => <button key={c} className="pill !min-h-[36px] !px-3 !text-xs" aria-pressed={cats.includes(c)} onClick={() => toggleCat(c)}>{CAT_LABEL[c]}</button>)}</div>
          </fieldset>
          <div><label className="label" htmlFor="bud">Orçamento até</label>
            <select id="bud" className="field" value={budget} onChange={(e) => setBudget(e.target.value as Budget)}>{(Object.keys(BUDGET_LABEL) as Budget[]).map((b) => <option key={b} value={b}>{BUDGET_LABEL[b]}</option>)}</select></div>
          <div><label className="label" htmlFor="reg">Região</label>
            <select id="reg" className="field" value={region} onChange={(e) => setRegion(e.target.value as Region)}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <fieldset><legend className="label">Clima</legend>
            <Seg label="Clima" value={weatherMode} onChange={setWeatherMode} options={[{ v: 'auto', l: 'Pela previsão' }, { v: 'coberto', l: 'Só coberto' }, { v: 'livre', l: 'Tanto faz' }]} /></fieldset>
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--tomate))]" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} /><Heart size={16} aria-hidden />Só favoritos ({favs.ids.length})</label>
          <button className="btn-ghost w-full" onClick={clear}>Limpar filtros</button>
        </aside>

        <section aria-live="polite" aria-label="Lugares">
          <p className="mb-3 text-sm font-bold text-muted">{list.length} {list.length === 1 ? 'opção' : 'opções'}</p>
          {list.length === 0 ? <Empty title="Nada com esses filtros" text={coveredOnly ? 'Estou mostrando só lugares cobertos por causa da chuva. Mude o filtro de clima se quiser arriscar.' : 'Tire um filtro ou dois.'} action={<button className="btn-outline" onClick={clear}>Limpar filtros</button>} /> : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => (
                <li key={p.id} className="chip flex flex-col overflow-hidden">
                  <button onClick={() => setOpen(p)} className="flex flex-1 flex-col p-4 text-left">
                    <div className="mb-2 flex flex-wrap gap-1">
                      {p.kind === 'busca' ? <span className="tag bg-mar/15 text-mar">Busca no mapa</span> : <span className="tag bg-arauc/15 text-arauc">{p.bairro ?? p.region}</span>}
                      <span className="tag bg-sunk">{BUDGET_LABEL[p.budget]}</span>
                      <span className="tag bg-sunk">{p.indoor ? 'Coberto' : 'Ao ar livre'}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                    <p className="mt-1 line-clamp-3 text-sm text-muted">{p.blurb}</p>
                    {!p.indoor && outlook.status === 'risky' && <p className="mt-2 text-xs font-bold text-warn">Chance de chuva nas próximas horas.</p>}
                  </button>
                  <div className="flex items-center gap-2 border-t-2 border-ink/10 p-3">
                    <ExtLink href={mapsUrl(p.maps)} className="btn-outline !min-h-[44px] flex-1 text-sm"><MapPin size={16} />{p.kind === 'busca' ? 'Ver opções' : 'Mapa'}</ExtLink>
                    <FavButton active={favs.has(p.id)} onClick={() => { favs.toggle(p.id); if (!favs.has(p.id)) unlock('fav'); }} label={p.name} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''}>
        {open && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              <SourceBadge kind="editorial" />
              {open.cats.map((c) => <span key={c} className="tag bg-sunk">{CAT_LABEL[c]}</span>)}
            </div>
            <p className="text-lg">{open.blurb}</p>
            {open.tip && <p className="rounded-xl bg-ipe/20 px-3 py-2 text-sm"><b>Dica:</b> {open.tip}</p>}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl bg-sunk p-2"><dt className="text-muted">Onde</dt><dd className="font-bold">{open.bairro ?? open.region}</dd></div>
              <div className="rounded-xl bg-sunk p-2"><dt className="text-muted">Tempo típico</dt><dd className="font-bold">{open.durationH < 1 ? '30 min' : `${open.durationH.toLocaleString('pt-BR')} h`}</dd></div>
              <div className="rounded-xl bg-sunk p-2"><dt className="text-muted">Orçamento (estimativa)</dt><dd className="font-bold">{BUDGET_LABEL[open.budget]}</dd></div>
              <div className="rounded-xl bg-sunk p-2"><dt className="text-muted">Ambiente</dt><dd className="font-bold">{open.indoor ? 'Coberto' : 'Ao ar livre'}</dd></div>
            </dl>
            {!open.indoor && rainNow && <p className="rounded-xl bg-warn/15 px-3 py-2 text-sm font-bold text-warn">Chuva prevista nas próximas horas em Curitiba.</p>}
            <p className="text-xs text-muted">Recomendação editorial. Horários, preços e funcionamento não foram confirmados hoje.</p>
            <div className="flex flex-wrap gap-2">
              <ExtLink href={mapsUrl(open.maps)} className="btn-primary"><MapPin size={16} />Abrir no mapa</ExtLink>
              <FavButton active={favs.has(open.id)} onClick={() => { favs.toggle(open.id); unlock('fav'); }} label={open.name} />
              <button className="btn-outline" onClick={surprise}><Shuffle size={16} />Outro</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
