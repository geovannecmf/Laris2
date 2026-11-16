import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, MapPin } from 'lucide-react';
import { Seg, ExtLink, SourceBadge } from '../../components/ui';
import { useApp } from '../../components/AppState';
import { recommend, type BoredFilters } from '../../lib/recommend';
import { PLACES, mapsUrl } from '../../data/curitiba';
import type { Activity } from '../../data/activities';

const COLORS = ['--ipe', '--mar', '--tomate', '--arauc', '--lavanda', '--kiwi', '--warn', '--mar'];

export default function Wheel() {
  const { outlook, unlock } = useApp();
  const [where, setWhere] = useState<BoredFilters['where']>('tanto-faz');
  const [cost, setCost] = useState<BoredFilters['cost']>('economico');
  const [time, setTime] = useState<BoredFilters['time']>('1h');
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Activity | null>(null);
  const seed = useRef(Math.random());

  const items = useMemo(() => {
    const all = recommend({ where, company: 'acompanhada', cost, time, vibe: 'qualquer', space: 'tanto-faz' }, outlook.status).filter((s) => !s.blocked);
    const r = seed.current;
    return all.map((s, i) => ({ s, k: Math.sin((i + 1) * 9301 * r) })).sort((a, b) => a.k - b.k).slice(0, 8).map((x) => x.s.activity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [where, cost, time, outlook.status]);

  const n = items.length;
  const seg = 360 / Math.max(1, n);
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const spin = () => {
    if (spinning || n < 2) return;
    const target = Math.floor(Math.random() * n);
    // O ponteiro fica no topo (0°). Centro da fatia target em target*seg + seg/2.
    const base = angle - (angle % 360);
    const final = base + 360 * (reduce ? 1 : 6) + (360 - (target * seg + seg / 2));
    setResult(null);
    setSpinning(true);
    setAngle(final);
    setTimeout(() => { setSpinning(false); setResult(items[target]); unlock('wheel'); if (navigator.vibrate) navigator.vibrate(30); }, reduce ? 50 : 4200);
  };

  const R = 150;
  const arc = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180, a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    return `M${R},${R} L${R + R * Math.cos(a0)},${R + R * Math.sin(a0)} A${R},${R} 0 ${seg > 180 ? 1 : 0} 1 ${R + R * Math.cos(a1)},${R + R * Math.sin(a1)} Z`;
  };
  const place = result?.placeId ? PLACES.find((p) => p.id === result.placeId) : null;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_1fr] md:items-center">
      <div>
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          <svg viewBox="0 0 300 300" className="h-full w-full drop-shadow-[4px_4px_0_rgb(var(--ink))]" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? `transform ${reduce ? 0 : 4}s cubic-bezier(.15,.85,.2,1)` : 'none' }} aria-hidden>
            {items.map((it, i) => {
              const mid = ((i + 0.5) * seg - 90) * (Math.PI / 180);
              const tx = R + R * 0.58 * Math.cos(mid), ty = R + R * 0.58 * Math.sin(mid);
              const label = it.title.length > 18 ? it.title.slice(0, 17) + '…' : it.title;
              return (
                <g key={it.id}>
                  <path d={arc(i)} fill={`rgb(var(${COLORS[i % COLORS.length]}))`} stroke="rgb(var(--ink))" strokeWidth="2" />
                  <text x={tx} y={ty} fontSize="10.5" fontWeight="800" fill="#1C252D" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(i + 0.5) * seg} ${tx} ${ty})`}>{label}</text>
                </g>
              );
            })}
            <circle cx={R} cy={R} r="22" fill="rgb(var(--surface))" stroke="rgb(var(--ink))" strokeWidth="3" />
          </svg>
          <div className="absolute left-1/2 top-[-6px] h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-x-transparent border-t-ink" aria-hidden />
        </div>
        <button className="btn-primary mx-auto mt-5 flex min-h-[56px] w-full max-w-[340px] text-lg" onClick={spin} disabled={spinning || n < 2}><RotateCw size={18} className={spinning ? 'animate-spin' : ''} />{spinning ? 'Girando…' : 'Girar a roleta'}</button>
        {n < 2 && <p className="mt-2 text-center text-sm text-muted">Poucas opções com esses filtros. Afrouxe um deles.</p>}
      </div>
      <div className="space-y-4">
        <fieldset><legend className="label">Onde</legend><Seg label="Onde" value={where} onChange={(v) => { setWhere(v); setResult(null); }} options={[{ v: 'casa', l: 'Em casa' }, { v: 'rua', l: 'Na rua' }, { v: 'tanto-faz', l: 'Tanto faz' }]} /></fieldset>
        <fieldset><legend className="label">Gasto</legend><Seg label="Gasto" value={cost} onChange={(v) => { setCost(v); setResult(null); }} options={[{ v: 'gratis', l: 'Nada' }, { v: 'economico', l: 'Pouco' }, { v: 'livre', l: 'Sem limite' }]} /></fieldset>
        <fieldset><legend className="label">Tempo</legend><Seg label="Tempo" value={time} onChange={(v) => { setTime(v); setResult(null); }} options={[{ v: '15m', l: '15 min' }, { v: '1h', l: '1 h' }, { v: 'horas', l: 'Horas' }, { v: 'dia', l: 'Dia' }]} /></fieldset>
        {outlook.status === 'bad' && <p className="text-sm font-bold text-mar">Chuva prevista: a roleta tirou as opções ao ar livre.</p>}
        <div aria-live="polite">
          {result && (
            <div className="chip anim-pop p-4">
              <SourceBadge kind="editorial" />
              <p className="mt-2 font-display text-2xl font-extrabold leading-tight">{result.title}</p>
              <p className="mt-1 text-muted">{result.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.link && <Link to={result.link.to} className="btn-dark">{result.link.label}</Link>}
                {place && <ExtLink href={mapsUrl(place.maps)} className="btn-dark"><MapPin size={16} />Mapa</ExtLink>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
