import { useEffect, useRef, useState } from 'react';
import { useStored } from '../../lib/storage';
import { useApp } from '../../components/AppState';

type S = 'idle' | 'wait' | 'go' | 'early' | 'result';

export default function Reflex() {
  const { unlock } = useApp();
  const [best, setBest] = useStored<number | null>('rec-reflex', null);
  const [s, setS] = useState<S>('idle');
  const [ms, setMs] = useState<number | null>(null);
  const [tries, setTries] = useState<number[]>([]);
  const t0 = useRef(0);
  const timer = useRef<number>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const press = () => {
    if (s === 'idle' || s === 'result' || s === 'early') {
      setS('wait');
      timer.current = window.setTimeout(() => { t0.current = performance.now(); setS('go'); }, 1200 + Math.random() * 2800);
    } else if (s === 'wait') {
      clearTimeout(timer.current); setS('early');
    } else if (s === 'go') {
      const v = Math.round(performance.now() - t0.current);
      setMs(v); setTries((t) => [...t.slice(-4), v]); setS('result');
      setBest((b) => (b == null ? v : Math.min(b, v)));
      if (v < 300) unlock('reflex');
    }
  };
  const avg = tries.length ? Math.round(tries.reduce((a, b) => a + b, 0) / tries.length) : null;
  const style = { idle: 'bg-surface', wait: 'bg-tomate text-white', go: 'bg-kiwi text-[#1C252D]', early: 'bg-warn text-[#1C252D]', result: 'bg-surface' }[s];
  const text = { idle: 'Toque para começar', wait: 'Espere o verde…', go: 'AGORA!', early: 'Cedo demais. Toque para tentar de novo.', result: `${ms} ms` }[s];

  return (
    <div className="mx-auto max-w-md">
      <button onPointerDown={(e) => { e.preventDefault(); press(); }} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); } }}
        className={`flex aspect-square w-full flex-col items-center justify-center rounded-3xl border-[3px] border-ink p-6 text-center font-display text-4xl font-extrabold shadow-chip ${style}`} aria-live="assertive">
        {text}
        {s === 'result' && <span className="mt-2 font-body text-base font-bold">{ms! < 250 ? 'Reflexo de goleira.' : ms! < 350 ? 'Bom!' : 'Café, talvez?'} Toque para outra.</span>}
      </button>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="chip p-3"><p className="text-sm text-muted">Recorde</p><p className="font-display text-2xl font-extrabold">{best != null ? `${best} ms` : '–'}</p></div>
        <div className="chip p-3"><p className="text-sm text-muted">Média (últimas 5)</p><p className="font-display text-2xl font-extrabold">{avg != null ? `${avg} ms` : '–'}</p></div>
      </div>
    </div>
  );
}
