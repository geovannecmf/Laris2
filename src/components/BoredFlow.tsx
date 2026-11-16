import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, MapPin, CloudRain, ArrowLeft, Share2 } from 'lucide-react';
import { Sheet, Seg, SourceBadge, ExtLink, shareText } from './ui';
import { useApp } from './AppState';
import { useStored } from '../lib/storage';
import { recommend, pick, type BoredFilters, type Suggestion } from '../lib/recommend';
import { TIME_LABEL, VIBE_LABEL } from '../data/activities';
import { PLACES, mapsUrl } from '../data/curitiba';
import { spNow } from '../lib/time';

const DEFAULT: BoredFilters = { where: 'tanto-faz', company: 'acompanhada', cost: 'economico', time: '1h', vibe: 'qualquer', space: 'tanto-faz' };

/** Filtros automáticos do modo "Não quero decidir": horário + clima. */
export function autoFilters(weather: string): BoredFilters {
  const { hour, weekday } = spNow();
  const weekend = weekday === 0 || weekday === 6;
  const night = hour >= 20 || hour < 6;
  return {
    where: night || weather === 'bad' ? 'casa' : 'tanto-faz',
    company: 'acompanhada',
    cost: 'economico',
    time: night ? '1h' : weekend ? 'horas' : '1h',
    vibe: 'qualquer',
    space: weather === 'bad' ? 'interna' : 'tanto-faz',
  };
}

export function BoredFlow({ open, onClose, autoPick = false }: { open: boolean; onClose: () => void; autoPick?: boolean }) {
  const { outlook, unlock, toast } = useApp();
  const [saved, setSaved] = useStored<BoredFilters>('bored-filters', DEFAULT);
  const [f, setF] = useState<BoredFilters>(saved);
  const [result, setResult] = useState<Suggestion | null>(null);
  const [list, setList] = useState<Suggestion[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [key, setKey] = useState(0);
  const [didAuto, setDidAuto] = useState(false);

  const run = (filters: BoredFilters, exclude: string[] = []) => {
    const all = recommend(filters, outlook.status);
    const fresh = all.filter((s) => !exclude.includes(s.activity.id) && !s.blocked);
    const choice = pick(fresh.length ? fresh : all.filter((s) => !s.blocked)) ?? null;
    setList(all);
    setResult(choice);
    setKey((k) => k + 1);
    if (choice) setSeen((p) => [...p, choice.activity.id]);
  };

  useEffect(() => {
    if (open && autoPick && !didAuto) {
      setDidAuto(true);
      const af = autoFilters(outlook.status);
      setF(af);
      run(af);
      unlock('nodecide');
    }
    if (!open && didAuto) setDidAuto(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoPick, didAuto]);

  const set = <K extends keyof BoredFilters>(k: K, v: BoredFilters[K]) => setF((p) => ({ ...p, [k]: v }));
  const others = useMemo(() => list.filter((s) => s.activity.id !== result?.activity.id && !s.blocked).slice(0, 4), [list, result]);
  const blockedCount = list.filter((s) => s.blocked).length;
  const place = result?.activity.placeId ? PLACES.find((p) => p.id === result.activity.placeId) : undefined;

  const close = () => { setResult(null); setSeen([]); onClose(); };

  return (
    <Sheet open={open} onClose={close} title={result ? 'Que tal isso?' : 'Vamos resolver esse tédio'}>
      {!result ? (
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSaved(f); unlock('bored'); run(f); }}>
          {outlook.status !== 'unknown' && (
            <p className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${outlook.status === 'ok' ? 'bg-ok/10 text-ok' : 'bg-warn/15 text-warn'}`}>
              <CloudRain size={16} aria-hidden />
              {outlook.status === 'ok' ? 'Céu colaborando nas próximas horas.' : outlook.status === 'risky' ? `Chance de chuva de até ${outlook.maxProb}% nas próximas horas.` : 'Chuva prevista nas próximas horas: vou priorizar programas cobertos.'}
            </p>
          )}
          {outlook.status === 'unknown' && <p className="rounded-xl bg-sunk px-3 py-2 text-sm text-muted">Sem previsão confirmada agora: ideias ao ar livre virão com aviso.</p>}
          <fieldset><legend className="label">Onde?</legend><Seg label="Onde" value={f.where} onChange={(v) => set('where', v)} options={[{ v: 'casa', l: 'Em casa' }, { v: 'rua', l: 'Na rua' }, { v: 'tanto-faz', l: 'Tanto faz' }]} /></fieldset>
          <fieldset><legend className="label">Com quem?</legend><Seg label="Com quem" value={f.company} onChange={(v) => set('company', v)} options={[{ v: 'sozinha', l: 'Sozinha' }, { v: 'acompanhada', l: 'Acompanhada' }]} /></fieldset>
          <fieldset><legend className="label">Quanto quer gastar?</legend><Seg label="Orçamento" value={f.cost} onChange={(v) => set('cost', v)} options={[{ v: 'gratis', l: 'Nada' }, { v: 'economico', l: 'Pouco' }, { v: 'livre', l: 'Sem limite' }]} /></fieldset>
          <fieldset><legend className="label">Quanto tempo tem?</legend><Seg label="Tempo" value={f.time} onChange={(v) => set('time', v)} options={(Object.keys(TIME_LABEL) as (keyof typeof TIME_LABEL)[]).map((k) => ({ v: k, l: TIME_LABEL[k] }))} /></fieldset>
          <fieldset><legend className="label">Que tipo de coisa?</legend><Seg label="Tipo" value={f.vibe} onChange={(v) => set('vibe', v)} options={[{ v: 'qualquer', l: 'Qualquer' }, ...(Object.keys(VIBE_LABEL) as (keyof typeof VIBE_LABEL)[]).map((k) => ({ v: k, l: VIBE_LABEL[k] }))]} /></fieldset>
          <fieldset><legend className="label">Coberto ou ao ar livre?</legend><Seg label="Ambiente" value={f.space} onChange={(v) => set('space', v)} options={[{ v: 'interna', l: 'Coberto' }, { v: 'externa', l: 'Ao ar livre' }, { v: 'tanto-faz', l: 'Tanto faz' }]} /></fieldset>
          <button type="submit" className="btn-primary w-full text-lg" data-autofocus>Me dá uma ideia</button>
        </form>
      ) : (
        <div className="space-y-4">
          <article key={key} className="chip anim-pop overflow-hidden">
            <div className="h-3 bg-ipe" />
            <div className="p-5">
              <div className="mb-2 flex flex-wrap gap-2">
                <SourceBadge kind="editorial" label={place ? 'Lugar: curadoria editorial' : 'Ideia editorial'} />
                {result.activity.outdoor && <span className="tag bg-arauc/15 text-arauc">Ao ar livre</span>}
              </div>
              <h3 className="font-display text-2xl font-extrabold leading-tight">{result.activity.title}</h3>
              <p className="mt-2 text-muted">{result.activity.text}</p>
              {result.weatherNote && <p className="mt-3 rounded-lg bg-warn/15 px-3 py-2 text-sm font-bold text-warn">{result.weatherNote}</p>}
              {place && <p className="mt-3 text-sm text-muted">Confirme horário e funcionamento antes de sair.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {result.activity.link && <Link to={result.activity.link.to} onClick={close} className="btn-dark">{result.activity.link.label}</Link>}
                {place && <ExtLink href={mapsUrl(place.maps)} className="btn-dark"><MapPin size={16} />Abrir no mapa</ExtLink>}
                <button className="btn-outline" onClick={async () => {
                  const r = await shareText('Modo Antitédio', `Ideia para hoje: ${result.activity.title}. ${result.activity.text}`);
                  if (r === 'copied') toast('Ideia copiada para a área de transferência');
                }}><Share2 size={16} />Mandar a ideia</button>
              </div>
            </div>
          </article>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary flex-1" onClick={() => run(f, seen)}><Shuffle size={16} />Outra ideia</button>
            <button className="btn-outline" onClick={() => { setResult(null); setKey(0); }}><ArrowLeft size={16} />Mudar filtros</button>
          </div>
          {others.length > 0 && (
            <div>
              <h4 className="mb-2 font-display font-bold">Também combinam com seus filtros</h4>
              <ul className="space-y-2">
                {others.map((s) => (
                  <li key={s.activity.id}>
                    <button className="w-full rounded-xl border-2 border-ink/20 bg-surface px-4 py-3 text-left transition-colors hover:border-ink" onClick={() => { setResult(s); setKey((k) => k + 1); }}>
                      <span className="block font-bold">{s.activity.title}</span>
                      {s.weatherNote && <span className="text-xs text-warn">{s.weatherNote}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {blockedCount > 0 && <p className="text-sm text-muted">{blockedCount} ideia(s) ao ar livre ficaram de fora por causa da chuva prevista.</p>}
        </div>
      )}
      {!result && key > 0 && <p role="status" className="mt-3 rounded-xl bg-sunk px-3 py-2 text-sm font-bold">Nada combinou com todos esses filtros{list.some((x) => x.blocked) ? ' (as opções ao ar livre caíram por causa da chuva)' : ''}. Afrouxe um deles.</p>}
    </Sheet>
  );
}
