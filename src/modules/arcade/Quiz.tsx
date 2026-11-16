import { useMemo, useState } from 'react';
import { Check, X, RotateCcw, ArrowRight } from 'lucide-react';
import { QUESTIONS, type Question } from '../../data/quiz';
import { useStored } from '../../lib/storage';
import { useApp } from '../../components/AppState';

const CATS = ['Tudo', 'Cinema', 'Cultura geral', 'Curiosidades', 'Nova Zelândia', 'Curitiba'] as const;
function shuffle<T>(a: T[]) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function makeRound(cat: (typeof CATS)[number]) {
  const pool = QUESTIONS.filter((q) => cat === 'Tudo' || q.cat === cat);
  return shuffle(pool).slice(0, Math.min(10, pool.length)).map((q) => {
    const order = shuffle(q.options.map((_, i) => i));
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) } as Question;
  });
}

export default function Quiz() {
  const { unlock, confetti } = useApp();
  const [best, setBest] = useStored<number>('rec-quiz', 0);
  const [cat, setCat] = useState<(typeof CATS)[number]>('Tudo');
  const [round, setRound] = useState(() => makeRound('Tudo'));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const done = i >= round.length;
  const q = round[i];
  const pct = useMemo(() => Math.round((i / round.length) * 100), [i, round.length]);

  const start = (c = cat) => { setCat(c); setRound(makeRound(c)); setI(0); setPicked(null); setHits(0); };
  const choose = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === q.answer) setHits((h) => h + 1);
    else if (navigator.vibrate) navigator.vibrate(40);
  };
  const next = () => {
    const ni = i + 1;
    setI(ni); setPicked(null);
    if (ni >= round.length) {
      setBest((b) => Math.max(b, hits));
      if (hits >= 8) { unlock('quiz8'); confetti(); }
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {CATS.map((c) => <button key={c} className="pill shrink-0" aria-pressed={cat === c} onClick={() => start(c)}>{c}</button>)}
      </div>
      {!done ? (
        <div>
          <div className="mb-2 flex justify-between text-sm font-bold"><span>Pergunta {i + 1} de {round.length}</span><span>Acertos: {hits} · Recorde: {best}</span></div>
          <div className="mb-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-sunk"><div className="h-full bg-kiwi transition-[width] duration-300" style={{ width: `${pct}%` }} /></div>
          <div key={i} className="chip anim-pop p-5">
            <p className="text-sm font-bold text-muted">{q.cat}</p>
            <h3 className="mt-1 font-display text-2xl font-bold leading-tight">{q.q}</h3>
            <ul className="mt-4 space-y-2">
              {q.options.map((o, k) => {
                const state = picked === null ? '' : k === q.answer ? 'border-ok bg-ok/15' : k === picked ? 'border-bad bg-bad/10' : 'opacity-60';
                return (
                  <li key={k}>
                    <button onClick={() => choose(k)} disabled={picked !== null} className={`flex min-h-[52px] w-full items-center justify-between gap-2 rounded-xl border-2 border-ink/30 bg-surface px-4 py-2 text-left font-bold transition-colors ${state}`}>
                      {o}
                      {picked !== null && k === q.answer && <Check size={20} className="text-ok" aria-label="Resposta certa" />}
                      {picked === k && k !== q.answer && <X size={20} className="text-bad" aria-label="Sua resposta, errada" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {picked !== null && (
              <div className="anim-pop mt-4" aria-live="polite">
                <p className="font-bold">{picked === q.answer ? 'Na mosca.' : `Era: ${q.options[q.answer]}.`}</p>
                {q.fact && <p className="text-sm text-muted">{q.fact}</p>}
                <button className="btn-primary mt-3 w-full" onClick={next} data-autofocus>{i + 1 < round.length ? <>Próxima<ArrowRight size={16} /></> : 'Ver resultado'}</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="chip anim-pop p-6 text-center">
          <p className="font-display text-6xl font-extrabold">{hits}/{round.length}</p>
          <p className="mt-2 font-display text-xl font-bold">{hits === round.length ? 'Gabaritou. Suspeito.' : hits >= 8 ? 'Sabe muito.' : hits >= 5 ? 'Respeitável.' : 'O importante é participar. Dizem.'}</p>
          <p className="text-muted">Recorde: {Math.max(best, hits)}</p>
          <button className="btn-primary mt-4" onClick={() => start()}><RotateCcw size={16} />Nova rodada</button>
        </div>
      )}
    </div>
  );
}
