import { useEffect, useState } from 'react';
import { RotateCcw, Users, Cpu } from 'lucide-react';
import { Seg } from '../../components/ui';
import { useStored } from '../../lib/storage';
import { useApp } from '../../components/AppState';
import { winner, cpuMove, type Cell } from '../../lib/ttt';

type Mode = 'duo' | 'cpu';
type Level = 'facil' | 'medio' | 'dificil';

export default function TicTacToe() {
  const { unlock, confetti } = useApp();
  const [mode, setMode] = useStored<Mode>('ttt-mode', 'cpu');
  const [level, setLevel] = useStored<Level>('ttt-level', 'medio');
  const [score, setScore] = useStored<{ X: number; O: number; empate: number }>('rec-ttt', { X: 0, O: 0, empate: 0 });
  const [b, setB] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [starter, setStarter] = useState<'X' | 'O'>('X');
  const w = winner(b);

  useEffect(() => {
    if (!w) return;
    setScore((s) => ({ ...s, [w.who]: s[w.who] + 1 }));
    if (mode === 'cpu' && w.who === 'X') { unlock('ttt-cpu'); confetti(); }
    if (mode === 'cpu' && w.who === 'empate' && level === 'dificil') unlock('ttt-cpu');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w?.who, w?.line.join()]);

  useEffect(() => {
    if (mode !== 'cpu' || turn !== 'O' || w) return;
    const t = setTimeout(() => {
      const i = cpuMove(b, 'O', level);
      if (i >= 0) { setB((p) => { const n = [...p]; n[i] = 'O'; return n; }); setTurn('X'); }
    }, 420);
    return () => clearTimeout(t);
  }, [mode, turn, b, w, level]);

  const play = (i: number) => {
    if (b[i] || w || (mode === 'cpu' && turn === 'O')) return;
    const n = [...b]; n[i] = turn; setB(n); setTurn(turn === 'X' ? 'O' : 'X');
  };
  const again = () => { const s = starter === 'X' ? 'O' : 'X'; setStarter(s); setB(Array(9).fill(null)); setTurn(s); };
  const label = (p: 'X' | 'O') => (mode === 'cpu' ? (p === 'X' ? 'Você' : 'Computador') : p === 'X' ? 'Jogador X' : 'Jogador O');

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex flex-wrap gap-3">
        <Seg label="Modo" value={mode} onChange={(m) => { setMode(m); setB(Array(9).fill(null)); setTurn('X'); setStarter('X'); }} options={[{ v: 'cpu', l: 'Contra o computador' }, { v: 'duo', l: 'Duas pessoas' }]} />
        {mode === 'cpu' && <Seg label="Dificuldade" value={level} onChange={setLevel} options={[{ v: 'facil', l: 'Fácil' }, { v: 'medio', l: 'Médio' }, { v: 'dificil', l: 'Impossível' }]} />}
      </div>
      <p className="mb-3 font-display text-xl font-bold" aria-live="polite">
        {w ? (w.who === 'empate' ? 'Deu velha.' : `${label(w.who)} venceu${mode === 'cpu' && w.who === 'O' ? '. Previsível.' : '!'}`) : `Vez de ${label(turn)} (${turn})`}
      </p>
      <div className="grid grid-cols-3 gap-2" role="grid" aria-label="Tabuleiro">
        {b.map((c, i) => (
          <button key={i} onClick={() => play(i)} aria-label={`Casa ${i + 1}${c ? `, ${c}` : ', vazia'}`}
            className={`aspect-square rounded-2xl border-2 border-ink font-display text-6xl font-extrabold transition-colors ${w?.line.includes(i) ? 'bg-ipe text-[#1C252D]' : 'bg-surface'} ${c === 'X' ? 'text-mar' : 'text-tomate'}`}>
            <span className={c ? 'anim-pop inline-block' : ''}>{c}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="flex gap-3 text-sm font-bold">
          <span className="flex items-center gap-1">{mode === 'cpu' ? <Users size={14} /> : null}{label('X')}: {score.X}</span>
          <span className="flex items-center gap-1">{mode === 'cpu' ? <Cpu size={14} /> : null}{label('O')}: {score.O}</span>
          <span>Velha: {score.empate}</span>
        </p>
        <button className="btn-primary" onClick={again}><RotateCcw size={16} />{w ? 'Nova partida' : 'Reiniciar'}</button>
      </div>
      <button className="btn-ghost mt-2 text-sm" onClick={() => setScore({ X: 0, O: 0, empate: 0 })}>Zerar placar</button>
    </div>
  );
}
