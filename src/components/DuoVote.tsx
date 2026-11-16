import { useMemo, useState } from 'react';
import { X, Heart, HelpCircle, RotateCcw, Users, PartyPopper } from 'lucide-react';
import { useStored } from '../lib/storage';
import { useApp } from './AppState';
import { Empty } from './ui';

export interface VoteItem { id: string; title: string; subtitle?: string; poster?: string }
type V = 'sim' | 'talvez' | 'nao';
interface State { a: Record<string, V>; b: Record<string, V>; step: 'a' | 'b' | 'fim'; pool: string[] }

/** Votação a dois no mesmo aparelho: cada pessoa vota sem ver o voto da outra. */
export function DuoVote({ items, storageKey, accent = 'tomate', emptyText }: { items: VoteItem[]; storageKey: string; accent?: string; emptyText?: string }) {
  const { unlock, confetti } = useApp();
  const [s, setS] = useStored<State>(storageKey, { a: {}, b: {}, step: 'a', pool: [] });
  const [handoff, setHandoff] = useState(false);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const pool = (s.pool.length ? s.pool : items.slice(0, 12).map((i) => i.id)).filter((id) => byId.has(id));
  const who = s.step === 'a' ? s.a : s.b;
  const pending = pool.filter((id) => !(id in who));
  const current = byId.get(pending[0] ?? '');

  if (!items.length) return <Empty title="Nada para votar ainda" text={emptyText ?? 'Adicione títulos para começar.'} />;

  const start = () => setS({ a: {}, b: {}, step: 'a', pool: items.slice(0, 12).map((i) => i.id) });
  const vote = (v: V) => {
    if (!current) return;
    const next = { ...s, pool, [s.step]: { ...who, [current.id]: v } } as State;
    const left = pool.filter((id) => !(id in (next[s.step as 'a' | 'b'])));
    if (!left.length) {
      if (s.step === 'a') { next.step = 'b'; setHandoff(true); }
      else {
        next.step = 'fim';
        const hasMatch = pool.some((id) => next.a[id] === 'sim' && next.b[id] === 'sim');
        if (hasMatch) { unlock('match'); confetti(); }
      }
    }
    setS(next);
  };

  if (s.step === 'fim') {
    const score = (id: string) => { const m = { sim: 2, talvez: 1, nao: -5 }; return m[s.a[id] ?? 'nao'] + m[s.b[id] ?? 'nao']; };
    const ranked = pool.map((id) => ({ id, sc: score(id) })).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    const top = ranked[0];
    return (
      <div className="space-y-3">
        {top ? (
          <div className="chip anim-pop overflow-hidden">
            <div className="h-3" style={{ background: `rgb(var(--${accent}))` }} />
            <div className="flex gap-4 p-4">
              {byId.get(top.id)?.poster && <img src={byId.get(top.id)!.poster} alt="" className="w-20 rounded-lg border-2 border-ink object-cover" />}
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-muted"><PartyPopper size={16} aria-hidden />{top.sc >= 4 ? 'Deu match!' : 'Melhor acordo possível'}</p>
                <p className="font-display text-2xl font-extrabold leading-tight">{byId.get(top.id)?.title}</p>
                <p className="text-sm text-muted">{top.sc >= 4 ? 'As duas pessoas votaram "quero".' : 'Ninguém vetou e pelo menos uma pessoa quer.'}</p>
              </div>
            </div>
          </div>
        ) : <Empty title="Nenhum consenso" text="Todo título levou pelo menos um veto. Tentem de novo com outra lista, ou deixem a roleta decidir." />}
        {ranked.length > 1 && (
          <ol className="space-y-1">
            {ranked.slice(1, 5).map((r) => <li key={r.id} className="rounded-lg bg-sunk px-3 py-2 text-sm"><b>{byId.get(r.id)?.title}</b> <span className="text-muted">({r.sc >= 4 ? 'quero + quero' : r.sc === 3 ? 'quero + talvez' : 'talvez + talvez'})</span></li>)}
          </ol>
        )}
        <button className="btn-outline" onClick={start}><RotateCcw size={16} />Nova votação</button>
      </div>
    );
  }

  if (handoff) {
    return (
      <div className="chip p-6 text-center">
        <Users size={36} className="mx-auto" aria-hidden />
        <p className="mt-2 font-display text-2xl font-extrabold">Passa o celular.</p>
        <p className="text-muted">Pessoa 1 já votou. Agora é a vez da Pessoa 2, sem espiar.</p>
        <button className="btn-primary mt-4" onClick={() => setHandoff(false)}>Sou a Pessoa 2, bora</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm font-bold">
        <span>Vez da {s.step === 'a' ? 'Pessoa 1' : 'Pessoa 2'}</span>
        <span className="text-muted">{pool.length - pending.length + 1} de {pool.length}</span>
      </div>
      {current && (
        <div key={current.id + s.step} className="chip anim-pop flex gap-4 overflow-hidden p-4">
          {current.poster ? <img src={current.poster} alt={`Cartaz de ${current.title}`} className="w-24 shrink-0 rounded-lg border-2 border-ink object-cover" /> : <div className="grid w-24 shrink-0 place-items-center rounded-lg p-2 text-center font-display text-sm font-bold text-[#1C252D]" style={{ background: `rgb(var(--${accent}) / .8)` }}>{current.title}</div>}
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold leading-tight">{current.title}</p>
            {current.subtitle && <p className="mt-1 line-clamp-4 text-sm text-muted">{current.subtitle}</p>}
          </div>
        </div>
      )}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button className="btn-outline" onClick={() => vote('nao')}><X size={18} />Não</button>
        <button className="btn-outline" onClick={() => vote('talvez')}><HelpCircle size={18} />Talvez</button>
        <button className="btn-primary" onClick={() => vote('sim')}><Heart size={18} />Quero</button>
      </div>
      <button className="btn-ghost mt-2 text-sm" onClick={start}><RotateCcw size={14} />Recomeçar com a lista atual</button>
    </div>
  );
}
