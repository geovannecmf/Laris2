import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Moon, SunMedium, LayoutGrid } from 'lucide-react';
import { NAV, BOTTOM } from './nav';
import { Sheet } from './ui';
import { useStored } from '../lib/storage';
import { useApp } from './AppState';

export function useTheme() {
  const [theme, setTheme] = useStored<'light' | 'dark' | null>('theme', null);
  const system = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const current = theme ?? system;
  useEffect(() => {
    document.documentElement.classList.toggle('dark', current === 'dark');
  }, [current]);
  return { theme: current, toggle: () => setTheme(current === 'dark' ? 'light' : 'dark') };
}

function Logo({ onTap }: { onTap: () => void }) {
  const [wob, setWob] = useState(0);
  return (
    <NavLink to="/" onClick={() => { onTap(); setWob(Date.now()); }} className="flex items-center gap-2.5" aria-label="Modo Antitédio, ir para o início">
      <span key={wob} className={`grid h-10 w-10 place-items-center rounded-xl border-2 border-ink bg-ipe shadow-chipsm ${wob ? 'anim-wobble' : ''}`}>
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden><path d="M5 18c3.5-6 7.5-6 11 0s7.5 6 11 0" stroke="#1C252D" strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
      </span>
      <span className="font-display text-lg font-extrabold leading-none">Modo<br />Antitédio</span>
    </NavLink>
  );
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { unlock, toast, confetti } = useApp();
  const [more, setMore] = useState(false);
  const loc = useLocation();
  const taps = useRef<number[]>([]);
  useEffect(() => { setMore(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      pos = e.key === KONAMI[pos] ? pos + 1 : e.key === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) { pos = 0; unlock('konami'); confetti(); toast('Kia ora!', 'info', 'Modo neozelandês ativado por 10 segundos. Ele não faz nada, mas é simpático.'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlock, toast, confetti]);
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 7) { taps.current = []; unlock('logo'); toast('Ok, ok. Eu estou acordado.', 'info', 'Sete cutucadas. Você realmente estava entediada.'); }
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-bg">Pular para o conteúdo</a>
      {/* Desktop: trilho lateral */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r-2 border-ink/10 px-5 py-6 lg:flex">
        <Logo onTap={onLogoTap} />
        <nav aria-label="Módulos" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 font-display font-semibold transition-colors ${isActive ? 'bg-ink text-bg' : 'hover:bg-sunk'}`}>
              <span className="h-7 w-2 rounded-full" style={{ background: `rgb(var(--${n.color}))` }} aria-hidden />
              <n.icon size={18} aria-hidden />
              <span className="leading-tight">{n.short === 'Início' ? 'Início' : n.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="btn-outline w-full" onClick={toggle}>{theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</button>
      </aside>

      <div className="min-w-0">
        {/* Mobile: topo */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b-2 border-ink/10 bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <Logo onTap={onLogoTap} />
          <button className="btn-ghost h-11 w-11 !px-0" onClick={toggle} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? <SunMedium size={20} /> : <Moon size={20} />}
          </button>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* Mobile: barra inferior */}
      <nav aria-label="Navegação principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-surface lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.filter((n) => BOTTOM.includes(n.to)).map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => `flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${isActive ? 'text-ink' : 'text-muted'}`}>
                {({ isActive }) => (<>
                  <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${isActive ? 'bg-ipe text-[#1C252D]' : ''}`}><n.icon size={20} aria-hidden /></span>
                  {n.short}
                </>)}
              </NavLink>
            </li>
          ))}
          <li>
            <button onClick={() => setMore(true)} className="flex min-h-[58px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-muted" aria-haspopup="dialog">
              <span className="grid h-8 w-12 place-items-center rounded-full"><LayoutGrid size={20} aria-hidden /></span>Mais
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Todos os módulos">
        <ul className="grid grid-cols-2 gap-3">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.to === '/'} className="chip flex h-full flex-col overflow-hidden">
                <span className="h-3" style={{ background: `rgb(var(--${n.color}))` }} />
                <span className="flex flex-1 flex-col gap-1 p-3">
                  <n.icon size={20} aria-hidden />
                  <span className="font-display font-bold leading-tight">{n.label}</span>
                  <span className="text-xs text-muted">{n.desc}</span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
