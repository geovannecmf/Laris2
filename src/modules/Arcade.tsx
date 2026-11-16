import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Worm, Hash, HelpCircle, Disc3, Grid3x3, Zap, type LucideIcon } from 'lucide-react';
import { ModuleHeader, Loading } from '../components/ui';
import { readStore } from '../lib/storage';

const GAMES: { id: string; name: string; desc: string; icon: LucideIcon; color: string; rec: () => string; C: React.LazyExoticComponent<() => JSX.Element> }[] = [
  { id: 'snake', name: 'Snake', desc: 'O clássico, com toque e teclado.', icon: Worm, color: 'kiwi', rec: () => `Recorde: ${readStore('rec-snake', 0)}`, C: lazy(() => import('./arcade/Snake')) },
  { id: 'velha', name: 'Jogo da Velha', desc: 'A dois ou contra uma CPU que não erra.', icon: Hash, color: 'mar', rec: () => { const s = readStore('rec-ttt', { X: 0, O: 0, empate: 0 }); return `X ${s.X} · O ${s.O} · velha ${s.empate}`; }, C: lazy(() => import('./arcade/TicTacToe')) },
  { id: 'quiz', name: 'Quiz Aleatório', desc: 'Cinema, curiosidades, NZ e Curitiba.', icon: HelpCircle, color: 'lavanda', rec: () => `Recorde: ${readStore('rec-quiz', 0)}/10`, C: lazy(() => import('./arcade/Quiz')) },
  { id: 'roleta', name: 'Roleta Antitédio', desc: 'Sorteia uma atividade real pelos filtros.', icon: Disc3, color: 'ipe', rec: () => 'Decide por você', C: lazy(() => import('./arcade/Wheel')) },
  { id: 'memoria', name: 'Jogo da Memória', desc: 'Oito pares, o menor número de jogadas.', icon: Grid3x3, color: 'tomate', rec: () => { const r = readStore<number | null>('rec-memory', null); return r ? `Recorde: ${r} jogadas` : 'Sem recorde'; }, C: lazy(() => import('./arcade/Memory')) },
  { id: 'reflexo', name: 'Desafio de Reflexo', desc: 'Toque quando ficar verde.', icon: Zap, color: 'arauc', rec: () => { const r = readStore<number | null>('rec-reflex', null); return r ? `Recorde: ${r} ms` : 'Sem recorde'; }, C: lazy(() => import('./arcade/Reflex')) },
];

export default function Arcade() {
  const { game } = useParams();
  const g = GAMES.find((x) => x.id === game);
  if (g) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <Link to="/arcade" className="btn-outline h-11 w-11 !px-0" aria-label="Voltar ao Arcade"><ArrowLeft size={18} /></Link>
          <h1 className="font-display text-3xl font-extrabold">{g.name}</h1>
        </div>
        <Suspense fallback={<Loading label="Ligando a máquina…" />}><g.C /></Suspense>
      </div>
    );
  }
  return (
    <div>
      <ModuleHeader code="AT-06" name="Verde Fliperama" color="kiwi" title="Arcade Antitédio" lead="Seis jogos de verdade, que funcionam no toque e no teclado. Os recordes ficam salvos neste aparelho." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((x) => (
          <li key={x.id}>
            <Link to={`/arcade/${x.id}`} className="chip flex h-full items-stretch overflow-hidden transition-transform active:translate-x-0.5 active:translate-y-0.5">
              <span className="grid w-24 shrink-0 place-items-center border-r-2 border-ink" style={{ background: `rgb(var(--${x.color}))` }}><x.icon size={36} className="text-[#1C252D]" aria-hidden /></span>
              <span className="flex flex-col justify-center p-4">
                <span className="font-display text-xl font-bold">{x.name}</span>
                <span className="text-sm text-muted">{x.desc}</span>
                <span className="mt-1 text-xs font-bold">{x.rec()}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
