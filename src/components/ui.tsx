import { useEffect, useRef, type ReactNode } from 'react';
import { Sun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, HelpCircle, X, RotateCw, ExternalLink, Heart, AlertTriangle, Radio, BookOpen, FlaskConical, Share2 } from 'lucide-react';
import { describeCode } from '../lib/weather';

export function WeatherIcon({ code, size = 20, className = '' }: { code: number | null; size?: number; className?: string }) {
  const k = describeCode(code).kind;
  const props = { size, className, 'aria-hidden': true } as const;
  if (k === 'sun') return <Sun {...props} />;
  if (k === 'cloud') return <Cloud {...props} />;
  if (k === 'fog') return <CloudFog {...props} />;
  if (k === 'drizzle') return <CloudDrizzle {...props} />;
  if (k === 'rain') return <CloudRain {...props} />;
  if (k === 'storm') return <CloudLightning {...props} />;
  return <HelpCircle {...props} />;
}

/** Selo de procedência do dado — sempre visível onde há informação. */
export function SourceBadge({ kind, label }: { kind: 'live' | 'editorial' | 'manual' | 'demo'; label?: string }) {
  const meta = {
    live: { icon: Radio, cls: 'bg-ok/15 text-ok', text: label ?? 'Ao vivo' },
    editorial: { icon: BookOpen, cls: 'bg-lavanda/15 text-lavanda', text: label ?? 'Editorial' },
    manual: { icon: FlaskConical, cls: 'bg-mar/15 text-mar', text: label ?? 'Registrado por você' },
    demo: { icon: FlaskConical, cls: 'bg-warn/20 text-warn', text: label ?? 'Demonstrativo' },
  }[kind];
  const I = meta.icon;
  return <span className={`tag ${meta.cls}`}><I size={12} aria-hidden />{meta.text}</span>;
}

export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('[data-autofocus],button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-fade absolute inset-0 bg-[#0d1217]/55" onClick={onClose} />
      <div ref={ref} className={`anim-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border-2 border-ink bg-bg pb-safe shadow-chip sm:rounded-[28px] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 border-ink/10 bg-bg/95 px-5 py-3 backdrop-blur">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button className="btn-ghost h-11 w-11 !px-0" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-muted">
      <span className="relative h-6 w-6">
        <span className="absolute inset-0 animate-ping rounded-md bg-ipe/60 motion-reduce:animate-none" />
        <span className="absolute inset-1 rounded-sm bg-ipe" />
      </span>
      <span className="font-bold">{label}</span>
    </div>
  );
}
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-sunk motion-reduce:animate-none ${className}`} />;
}

export function ErrorBox({ title, text, onRetry, children }: { title: string; text?: string; onRetry?: () => void; children?: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border-2 border-dashed border-bad/70 bg-bad/5 p-4">
      <p className="flex items-center gap-2 font-display font-bold text-bad"><AlertTriangle size={18} aria-hidden />{title}</p>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && <button className="btn-outline" onClick={onRetry}><RotateCw size={16} />Tentar de novo</button>}
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/25 p-6 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ExtLink({ href, children, className = 'btn-outline' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}<ExternalLink size={14} aria-hidden /><span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}

export function FavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-pressed={active} aria-label={active ? `Remover ${label} dos favoritos` : `Favoritar ${label}`}
      className={`grid h-11 w-11 place-items-center rounded-xl border-2 transition-transform active:scale-90 ${active ? 'border-tomate bg-tomate text-white' : 'border-ink/30 bg-surface text-ink'}`}>
      <Heart size={18} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}

export async function shareText(title: string, text: string, url = location.href): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return 'shared'; }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'failed';
  }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); return 'copied'; } catch { return 'failed'; }
}
export function ShareButton({ title, text, url, onDone }: { title: string; text: string; url?: string; onDone?: (r: 'shared' | 'copied' | 'failed') => void }) {
  return (
    <button className="btn-outline" onClick={async () => onDone?.(await shareText(title, text, url))}>
      <Share2 size={16} />Compartilhar
    </button>
  );
}
export function whatsappUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Cabeçalho de módulo como "amostra de tinta": faixa de cor + código. */
export function ModuleHeader({ code, name, color, title, lead, children }: { code: string; name: string; color: string; title: string; lead: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <div className="chip overflow-hidden">
        <div className="relative h-24 sm:h-28" style={{ background: `rgb(var(--${color}))` }}>
          <svg aria-hidden className="absolute bottom-0 left-0 h-6 w-full text-surface" viewBox="0 0 400 24" preserveAspectRatio="none">
            <path className="drip" d="M0 24V8c20 0 22 14 40 14s18-12 38-12 24 10 46 10 16-16 40-16 20 18 44 18 24-12 46-12 20 8 40 8 26-14 48-14 22 16 58 16v4Z" fill="currentColor" />
          </svg>
          <p className="absolute left-4 top-3 flex items-center gap-2 font-display text-sm font-bold text-[#1C252D]"><span className="rounded-md bg-[#1C252D] px-1.5 py-0.5 text-xs text-white">{code}</span>{name}</p>
        </div>
        <div className="px-4 pb-4 pt-1 sm:px-6">
          <h1 className="font-display text-3xl font-extrabold leading-[1.05] sm:text-5xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-base text-muted sm:text-lg">{lead}</p>
          {children}
        </div>
      </div>
    </header>
  );
}

export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className="pill" onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}
