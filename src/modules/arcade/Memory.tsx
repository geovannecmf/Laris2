import { useEffect, useState } from 'react';
import { RotateCcw, Plane, PaintRoller, Clapperboard, TreePine, Tv, Gamepad2, Coffee, CloudRain, type LucideIcon } from 'lucide-react';
import { useStored } from '../../lib/storage';
import { useApp } from '../../components/AppState';

const ICONS: { k: string; I: LucideIcon; c: string }[] = [
  { k: 'plane', I: Plane, c: '--mar' }, { k: 'paint', I: PaintRoller, c: '--ipe' }, { k: 'film', I: Clapperboard, c: '--tomate' }, { k: 'tree', I: TreePine, c: '--arauc' },
  { k: 'tv', I: Tv, c: '--lavanda' }, { k: 'game', I: Gamepad2, c: '--kiwi' }, { k: 'coffee', I: Coffee, c: '--warn' }, { k: 'rain', I: CloudRain, c: '--mar' },
];
function deal() {
  const d = [...ICONS, ...ICONS].map((x, i) => ({ id: i, k: x.k }));
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

export default function Memory() {
  const { unlock, confetti } = useApp();
  const [best, setBest] = useStored<number | null>('rec-memory', null);
  const [cards, setCards] = useState(deal);
  const [up, setUp] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const done = found.length === ICONS.length;

  useEffect(() => {
    if (up.length !== 2) return;
    const [a, b] = up.map((i) => cards[i]);
    const t = setTimeout(() => {
      if (a.k === b.k) setFound((f) => [...f, a.k]);
      setUp([]);
    }, a.k === b.k ? 250 : 800);
    return () => clearTimeout(t);
  }, [up, cards]);

  useEffect(() => {
    if (!done) return;
    setBest((b) => (b == null ? moves : Math.min(b, moves)));
    unlock('memory'); confetti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const flip = (i: number) => {
    if (up.length === 2 || up.includes(i) || found.includes(cards[i].k)) return;
    const n = [...up, i];
    setUp(n);
    if (n.length === 2) setMoves((m) => m + 1);
  };
  const reset = () => { setCards(deal()); setUp([]); setFound([]); setMoves(0); };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex justify-between font-display font-bold"><span>Jogadas: {moves}</span><span className="text-muted">Recorde: {best ?? '–'}</span></div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c, i) => {
          const meta = ICONS.find((x) => x.k === c.k)!;
          const shown = up.includes(i) || found.includes(c.k);
          return (
            <button key={c.id} onClick={() => flip(i)} aria-label={shown ? `Carta ${c.k}` : 'Carta virada para baixo'} aria-pressed={shown}
              className={`grid aspect-square place-items-center rounded-xl border-2 border-ink transition-[transform,background-color] duration-200 ${shown ? '' : 'bg-ink'} ${found.includes(c.k) ? 'opacity-70' : ''}`}
              style={shown ? { background: `rgb(var(${meta.c}))` } : undefined}>
              {shown ? <meta.I size={30} className="anim-pop text-[#1C252D]" aria-hidden /> : <span className="font-display text-xl font-extrabold text-bg" aria-hidden>?</span>}
            </button>
          );
        })}
      </div>
      {done && <p className="anim-pop mt-4 text-center font-display text-2xl font-extrabold" aria-live="polite">Concluído em {moves} jogadas.</p>}
      <button className="btn-primary mt-4 w-full" onClick={reset}><RotateCcw size={16} />Embaralhar de novo</button>
    </div>
  );
}
