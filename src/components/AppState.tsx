import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Trophy, X, Check, Info } from 'lucide-react';
import { useStored } from '../lib/storage';
import { ACHIEVEMENTS } from '../lib/achievements';
import { fetchForecast, getCachedForecast, outdoorOutlook, type Forecast } from '../lib/weather';
import { spNow } from '../lib/time';

type Toast = { id: number; kind: 'ok' | 'info' | 'trophy'; text: string; sub?: string };
interface Ctx {
  toast: (text: string, kind?: Toast['kind'], sub?: string) => void;
  unlock: (id: string) => void;
  unlocked: Record<string, number>;
  weather: { data: Forecast | null; loading: boolean; error: string | null; reload: () => void; stale: boolean };
  outlook: ReturnType<typeof outdoorOutlook>;
  confetti: () => void;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider ausente');
  return c;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unlocked, setUnlocked] = useStored<Record<string, number>>('achievements', {});
  const seq = useRef(0);
  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok', sub?: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, kind, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'trophy' ? 4200 : 2600);
  }, []);
  const unlock = useCallback(
    (id: string) => {
      setUnlocked((prev) => {
        if (prev[id]) return prev;
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (a) setTimeout(() => toast(`Conquista: ${a.name}`, 'trophy', a.hint), 0);
        return { ...prev, [id]: Date.now() };
      });
    },
    [setUnlocked, toast]
  );

  const [data, setData] = useState<Forecast | null>(() => getCachedForecast());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetchForecast(force)
      .then((f) => setData(f))
      .catch((e: unknown) => {
        const msg = e instanceof Error && e.name === 'AbortError' ? 'A previsão demorou demais para responder.' : 'Não consegui buscar a previsão na Open-Meteo.';
        setError(navigator.onLine === false ? 'Você está sem internet.' : msg);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
    const h = spNow().hour;
    if (h < 5) unlock('night');
  }, [load, unlock]);
  const reload = useCallback(() => load(true), [load]);
  const stale = !!data && Date.now() - data.fetchedAt > 3 * 3600 * 1000;
  const now = spNow();
  const nowIso = `${now.date}T${String(now.hour).padStart(2, '0')}:00`;
  const outlook = useMemo(() => outdoorOutlook(stale ? null : data, nowIso), [data, nowIso, stale]);

  const [pieces, setPieces] = useState<number>(0);
  const confetti = useCallback(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setPieces(Date.now());
    setTimeout(() => setPieces(0), 2600);
  }, []);

  const value = useMemo<Ctx>(() => ({ toast, unlock, unlocked, weather: { data, loading, error, reload, stale }, outlook, confetti }), [toast, unlock, unlocked, data, loading, error, reload, stale, outlook, confetti]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className="anim-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border-2 border-ink bg-surface px-4 py-3 shadow-chip">
            <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${t.kind === 'trophy' ? 'bg-ipe text-[#1C252D]' : t.kind === 'info' ? 'bg-mar text-white' : 'bg-ok text-white'}`}>
              {t.kind === 'trophy' ? <Trophy size={16} /> : t.kind === 'info' ? <Info size={16} /> : <Check size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold leading-tight">{t.text}</p>
              {t.sub && <p className="text-sm text-muted">{t.sub}</p>}
            </div>
            <button aria-label="Fechar aviso" className="text-muted" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}><X size={16} /></button>
          </div>
        ))}
      </div>
      {pieces > 0 && <Confetti key={pieces} />}
    </AppCtx.Provider>
  );
}

function Confetti() {
  const colors = ['rgb(var(--ipe))', 'rgb(var(--mar))', 'rgb(var(--tomate))', 'rgb(var(--arauc))', 'rgb(var(--lavanda))'];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {Array.from({ length: 48 }, (_, i) => (
        <span key={i} className="absolute top-[-20px] block h-3 w-2 rounded-sm" style={{
          left: `${(i * 37) % 100}%`, background: colors[i % colors.length],
          animation: `confetti-fall ${1.4 + (i % 7) * 0.15}s cubic-bezier(.2,.6,.4,1) ${(i % 10) * 0.05}s forwards`,
          ['--dx' as string]: `${((i * 53) % 120) - 60}px`,
        }} />
      ))}
    </div>
  );
}
