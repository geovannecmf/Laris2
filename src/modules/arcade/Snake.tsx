import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react';
import { useStored } from '../../lib/storage';
import { useApp } from '../../components/AppState';

const N = 18;
type P = { x: number; y: number };
type Dir = 'up' | 'down' | 'left' | 'right';
const V: Record<Dir, P> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

function freeCell(snake: P[]): P {
  const taken = new Set(snake.map((p) => p.x + ',' + p.y));
  const free: P[] = [];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if (!taken.has(x + ',' + y)) free.push({ x, y });
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 };
}

export default function Snake() {
  const { unlock } = useApp();
  const [best, setBest] = useStored<number>('rec-snake', 0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<'idle' | 'run' | 'pause' | 'over'>('idle');
  const [wrap, setWrap] = useStored<boolean>('snake-wrap', false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const g = useRef({ snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }] as P[], dir: 'right' as Dir, queue: [] as Dir[], food: { x: 13, y: 9 } as P, last: 0, score: 0 });

  const draw = useCallback(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const col = (v: string, a = 1) => `rgb(${css.getPropertyValue(v).trim().split(' ').join(',')},${a})`;
    const size = c.width; const s = size / N;
    ctx.fillStyle = col('--sunk'); ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = col('--ink', 0.06);
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) ctx.fillRect(x * s, y * s, s, s);
    const f = g.current.food;
    ctx.fillStyle = col('--tomate');
    ctx.beginPath(); ctx.arc(f.x * s + s / 2, f.y * s + s / 2, s * 0.38, 0, Math.PI * 2); ctx.fill();
    g.current.snake.forEach((p, i) => {
      ctx.fillStyle = i === 0 ? col('--ink') : col('--kiwi');
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x * s + pad, p.y * s + pad, s - pad * 2, s - pad * 2, s * 0.3); else ctx.rect(p.x * s + pad, p.y * s + pad, s - pad * 2, s - pad * 2); ctx.fill();
    });
  }, []);

  const reset = useCallback(() => {
    g.current = { snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }], dir: 'right', queue: [], food: { x: 13, y: 9 }, last: 0, score: 0 };
    setScore(0); draw();
  }, [draw]);

  const turn = useCallback((d: Dir) => {
    const q = g.current.queue;
    const lastDir = q[q.length - 1] ?? g.current.dir;
    if (d !== lastDir && d !== OPP[lastDir] && q.length < 3) q.push(d);
    setState((s) => (s === 'idle' ? 'run' : s));
  }, []);

  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const resize = () => { const w = Math.min(c.parentElement!.clientWidth, 520); const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = Math.floor(w * dpr / N) * N; c.height = c.width; c.style.width = w + 'px'; c.style.height = w + 'px'; draw(); };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  useEffect(() => {
    if (state !== 'run') return;
    let raf = 0;
    const step = (t: number) => {
      const G = g.current;
      const speed = Math.max(65, 150 - G.score * 3);
      if (t - G.last >= speed) {
        G.last = t;
        if (G.queue.length) G.dir = G.queue.shift()!;
        const h = G.snake[0];
        let nx = h.x + V[G.dir].x, ny = h.y + V[G.dir].y;
        if (wrap) { nx = (nx + N) % N; ny = (ny + N) % N; }
        const hitWall = nx < 0 || ny < 0 || nx >= N || ny >= N;
        const eats = nx === G.food.x && ny === G.food.y;
        const body = eats ? G.snake : G.snake.slice(0, -1);
        if (hitWall || body.some((p) => p.x === nx && p.y === ny)) {
          setState('over');
          if (navigator.vibrate) navigator.vibrate(80);
          setBest((b) => Math.max(b, G.score));
          return;
        }
        G.snake = [{ x: nx, y: ny }, ...body];
        if (eats) { G.score++; setScore(G.score); G.food = freeCell(G.snake); if (G.score >= 20) unlock('snake20'); }
        draw();
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const vis = () => document.hidden && setState('pause');
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', vis); };
  }, [state, draw, setBest, unlock, wrap]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      if (map[e.key]) { e.preventDefault(); if (state === 'over') return; turn(map[e.key]); }
      if (e.key === ' ') { e.preventDefault(); setState((s) => (s === 'run' ? 'pause' : s === 'over' ? s : 'run')); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [turn, state]);

  const touch = useRef<P | null>(null);
  const restart = () => { reset(); setState('run'); };

  return (
    <div className="mx-auto max-w-[520px]">
      <div className="mb-3 flex items-center justify-between font-display font-bold">
        <span className="text-2xl">Pontos: {score}</span>
        <span className="text-muted">Recorde: {best}</span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink">
        <canvas ref={canvas} className="touch-none-strict block" aria-label="Tabuleiro do Snake. Use as setas, WASD, deslize no tabuleiro ou os botões abaixo."
          onTouchStart={(e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; }}
          onTouchMove={(e) => {
            if (!touch.current) return;
            const t = e.touches[0]; const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
            turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
            touch.current = { x: t.clientX, y: t.clientY };
          }} />
        {state !== 'run' && (
          <div className="absolute inset-0 grid place-items-center bg-bg/70 backdrop-blur-[2px]">
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold">{state === 'over' ? (score > 0 && score >= best ? 'Novo recorde!' : 'Bateu.') : state === 'pause' ? 'Pausado' : 'Snake'}</p>
              <p className="mb-3 text-muted">{state === 'over' ? `${score} pontos` : 'Deslize, use as setas ou os botões.'}</p>
              <button className="btn-primary" onClick={state === 'over' ? restart : () => setState('run')} data-autofocus>{state === 'over' ? <><RotateCcw size={16} />Jogar de novo</> : <><Play size={16} />{state === 'pause' ? 'Continuar' : 'Começar'}</>}</button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Controles">
        <span />
        <button className="btn-outline h-14" aria-label="Para cima" onClick={() => turn('up')}><ArrowUp /></button>
        <span />
        <button className="btn-outline h-14" aria-label="Para a esquerda" onClick={() => turn('left')}><ArrowLeft /></button>
        <button className="btn-outline h-14" aria-label={state === 'run' ? 'Pausar' : 'Continuar'} onClick={() => setState((s) => (s === 'run' ? 'pause' : s === 'over' ? s : 'run'))} disabled={state === 'over'}>{state === 'run' ? <Pause /> : <Play />}</button>
        <button className="btn-outline h-14" aria-label="Para a direita" onClick={() => turn('right')}><ArrowRight /></button>
        <span />
        <button className="btn-outline h-14" aria-label="Para baixo" onClick={() => turn('down')}><ArrowDown /></button>
        <span />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-5 w-5" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />Modo sem paredes (atravessa as bordas)</label>
    </div>
  );
}
