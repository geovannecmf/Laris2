import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Droplets, Wind, Umbrella, RotateCw, Dices, PaintRoller, ArrowUpRight } from 'lucide-react';
import { useApp } from '../components/AppState';
import { BoredFlow } from '../components/BoredFlow';
import { WeatherIcon, SourceBadge, Skeleton, ErrorBox } from '../components/ui';
import { NAV } from '../components/nav';
import { describeCode, type Forecast } from '../lib/weather';
import { spNow, fmtClock, fmtLongToday, fmtDateTime, addDays, fmtDay, daySeed } from '../lib/time';
import { evaluatePaint, defaultConfig, type PaintConfig } from '../lib/paint';
import { ACTIVITIES } from '../data/activities';
import { CHALLENGES } from '../data/extras';
import { tmdb, tmdbAvailable, fromTmdb } from '../lib/tmdb';
import type { Title } from '../data/titles';

function greeting(h: number) {
  if (h < 5) return 'Madrugada acordada, hein.';
  if (h < 12) return 'Bom dia.';
  if (h < 18) return 'Boa tarde.';
  return 'Boa noite.';
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  return now;
}

/** Procura, nos próximos dias, o primeiro dia favorável para pintura externa e interna. */
export function findPaintWindows(f: Forecast | null, today: string) {
  if (!f) return null;
  const scan = (base: Partial<PaintConfig>) => {
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      if (i === 0 && spNow().hour > 10) continue;
      const cfg = { ...defaultConfig(date), ...base };
      const r = evaluatePaint(cfg, f.hourly, today);
      if (r.verdict === 'favoravel') return { date, cfg };
    }
    return null;
  };
  return { externa: scan({ mode: 'externa', room: 'fachada' }), interna: scan({}) };
}

export default function Home() {
  const { weather, outlook } = useApp();
  const now = useClock();
  const sp = spNow(now);
  const [bored, setBored] = useState(false);
  const [auto, setAuto] = useState(false);
  const [rnd, setRnd] = useState(() => Math.floor(Math.random() * ACTIVITIES.length));
  const [movies, setMovies] = useState<Title[] | null>(null);
  const f = weather.stale ? null : weather.data;
  const paint = useMemo(() => findPaintWindows(f, sp.date), [f, sp.date]);
  const challenge = CHALLENGES[daySeed(sp.date) % CHALLENGES.length];

  useEffect(() => {
    let alive = true;
    tmdbAvailable().then((ok) => ok && tmdb<{ results: unknown[] }>('movie/now_playing', { region: 'BR' }).then((j) => alive && setMovies(j.results.slice(0, 8).map((r) => fromTmdb(r, 'filme')))).catch(() => {}));
    return () => { alive = false; };
  }, []);

  const night = sp.hour >= 20 || sp.hour < 6;
  const weekend = sp.weekday === 0 || sp.weekday === 6;
  const main = useMemo(() => {
    if (outlook.status === 'bad') return { title: 'Chuva vindo. Plano coberto.', text: 'Cinema, museu ou uma partida no Arcade. A previsão indica chuva nas próximas horas em Curitiba.', to: '/cinema', cta: 'Ver o que está em cartaz', color: 'tomate' };
    if (night) return { title: 'Noite de sofá com critério.', text: 'Escolham um título juntos: cada um vota, o app cruza os gostos.', to: '/assistir', cta: 'Escolher o que assistir', color: 'lavanda' };
    if (paint?.externa && paint.externa.date === sp.date) return { title: 'Hoje dá pra pintar.', text: 'A previsão de hoje passa nos critérios para pintura externa. Confira os detalhes antes de abrir a lata.', to: '/pintar', cta: 'Ver a avaliação', color: 'ipe' };
    if (outlook.status === 'ok' && weekend) return { title: 'Fim de semana e céu aberto.', text: 'Bom momento para um parque. O Tanguá no fim da tarde é aposta segura.', to: '/curitiba', cta: 'Explorar Curitiba', color: 'arauc' };
    if (outlook.status === 'ok') return { title: 'O tempo está do seu lado.', text: 'Sem chuva prevista para as próximas horas. Bom momento para sair um pouco.', to: '/curitiba', cta: 'Ver ideias na rua', color: 'arauc' };
    if (outlook.status === 'risky') return { title: 'Céu indeciso, como sempre.', text: 'Há chance de chuva. Programas cobertos ou com plano B são a melhor aposta.', to: '/curitiba', cta: 'Ideias para dia instável', color: 'mar' };
    return { title: 'Deixa a roleta decidir.', text: 'Sem previsão confirmada agora. Que tal algo que não depende do céu?', to: '/arcade/roleta', cta: 'Girar a roleta', color: 'kiwi' };
  }, [outlook.status, night, weekend, paint, sp.date]);

  const act = ACTIVITIES[rnd % ACTIVITIES.length];
  const cur = f?.current;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
        <div className="flex flex-col justify-between gap-6 pt-2">
          <div>
            <p className="font-display text-lg font-semibold text-muted">{greeting(sp.hour)} <span className="capitalize">{fmtLongToday(now)}</span>, {fmtClock(now)}.</p>
            <h1 className="mt-3 font-display text-[2.6rem] font-extrabold leading-[0.95] tracking-tight sm:text-6xl xl:text-7xl">
              Você disse que estava entediada. Eu levei a sério.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Previsão do tempo, passagens para o outro lado do planeta, jogos e ideias para sair do sofá. Tudo num lugar que provavelmente não precisava existir. Mas agora existe.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={() => { setAuto(false); setBored(true); }}
              className="group relative min-h-[76px] rounded-2xl border-[3px] border-ink bg-ipe px-7 font-display text-2xl font-extrabold tracking-tight text-[#1C252D] shadow-chip transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none sm:text-3xl">
              ESTOU ENTEDIADA
            </button>
            <button onClick={() => { setAuto(true); setBored(true); }} className="btn-outline min-h-[56px]"><Dices size={18} />Não quero decidir</button>
          </div>
        </div>

        {/* Agora em Curitiba */}
        <aside className="chip relative overflow-hidden p-5" aria-label="Tempo agora em Curitiba">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">Agora em Curitiba</h2>
              {weather.data && <p className="text-xs text-muted">Atualizado em {fmtDateTime(weather.data.fetchedAt)}</p>}
            </div>
            {weather.data && !weather.stale && <SourceBadge kind="live" label="Open-Meteo" />}
          </div>
          {!weather.data && weather.loading && <div className="mt-4 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-10" /></div>}
          {weather.error && !f && (
            <div className="mt-4"><ErrorBox title="Sem previsão agora" text={`${weather.error} O resto do app funciona normalmente; ideias ao ar livre vêm com aviso.`} onRetry={weather.reload} /></div>
          )}
          {weather.stale && <p className="mt-3 rounded-lg bg-warn/15 px-3 py-2 text-sm font-bold text-warn">Previsão guardada está velha e não está sendo usada para decisões.</p>}
          {cur && !weather.stale && (
            <div className="mt-4">
              <div className="flex items-end gap-4">
                <WeatherIcon code={cur.code} size={56} className="text-mar" />
                <div>
                  <p className="font-display text-6xl font-extrabold leading-none">{cur.temp != null ? Math.round(cur.temp) : '–'}°</p>
                  <p className="font-bold">{describeCode(cur.code).label}{cur.feels != null && `, sensação de ${Math.round(cur.feels)}°`}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl bg-sunk p-2.5"><dt className="flex items-center gap-1 text-muted"><Droplets size={14} aria-hidden />Umidade</dt><dd className="font-display text-lg font-bold">{cur.humidity ?? '–'}%</dd></div>
                <div className="rounded-xl bg-sunk p-2.5"><dt className="flex items-center gap-1 text-muted"><Wind size={14} aria-hidden />Vento</dt><dd className="font-display text-lg font-bold">{cur.wind != null ? Math.round(cur.wind) : '–'} km/h</dd></div>
                <div className="rounded-xl bg-sunk p-2.5"><dt className="flex items-center gap-1 text-muted"><Umbrella size={14} aria-hidden />Chuva 6 h</dt><dd className="font-display text-lg font-bold">{outlook.maxProb ?? '–'}%</dd></div>
              </dl>
              {f && (
                <ol className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto px-1" aria-label="Próximos dias">
                  {f.daily.slice(0, 6).map((d) => (
                    <li key={d.date} className="min-w-[52px] flex-1 rounded-xl border-2 border-ink/10 p-1.5 text-center">
                      <p className="text-[11px] font-bold text-muted">{fmtDay(d.date, 'short').split(' ')[0]}</p>
                      <WeatherIcon code={d.code} size={18} className="mx-auto my-1" />
                      <p className="text-xs font-bold">{d.tMax != null ? Math.round(d.tMax) : '–'}°<span className="text-muted">/{d.tMin != null ? Math.round(d.tMin) : '–'}°</span></p>
                      <p className="text-[10px] text-mar">{d.precipProbMax ?? '–'}%</p>
                    </li>
                  ))}
                </ol>
              )}
              <button onClick={weather.reload} disabled={weather.loading} className="btn-ghost mt-2 !min-h-[36px] !px-2 text-sm"><RotateCw size={14} className={weather.loading ? 'animate-spin' : ''} />Atualizar</button>
            </div>
          )}
        </aside>
      </section>

      {/* Recomendação do momento + pintura */}
      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <Link to={main.to} className="chip group flex flex-col overflow-hidden transition-transform active:translate-x-0.5 active:translate-y-0.5">
          <div className="h-4" style={{ background: `rgb(var(--${main.color}))` }} />
          <div className="flex flex-1 flex-col p-5">
            <p className="text-sm font-bold text-muted">Recomendação do momento</p>
            <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight">{main.title}</h2>
            <p className="mt-2 text-muted">{main.text}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 font-display font-bold underline decoration-2 underline-offset-4">{main.cta}<ArrowUpRight size={18} aria-hidden /></span>
          </div>
        </Link>
        <div className="chip p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-muted"><PaintRoller size={16} aria-hidden />Radar de pintura</p>
          {!f && <p className="mt-2">Sem previsão carregada, não dá para apontar um dia. <Link to="/pintar" className="font-bold underline">Avaliar manualmente</Link>.</p>}
          {f && paint && (
            <div className="mt-2 space-y-3">
              <p className="font-display text-xl font-bold leading-tight">
                {paint.externa ? <>Próxima janela externa: <span className="capitalize">{fmtDay(paint.externa.date)}</span>.</> : 'Nenhum dia favorável para pintura externa nos próximos 7 dias.'}
              </p>
              <p className="text-sm text-muted">{paint.interna ? <>Interna: {fmtDay(paint.interna.date)} passa nos critérios.</> : 'Interna: umidade alta em todos os dias analisados.'} Simulação padrão: acrílica, 2 demãos, 24 h de proteção, início às 9h.</p>
              <Link to={paint.externa ? `/pintar?d=${paint.externa.date}&m=externa` : '/pintar'} className="btn-primary">Ajustar para a minha tinta</Link>
            </div>
          )}
        </div>
      </section>

      {/* Módulos como cartela de tintas */}
      <section aria-labelledby="mods">
        <h2 id="mods" className="section-title mb-3">Cartela de módulos</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {NAV.slice(1).map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="chip flex h-full flex-col overflow-hidden transition-transform active:translate-x-0.5 active:translate-y-0.5">
                <span className="relative block h-16" style={{ background: `rgb(var(--${n.color}))` }}>
                  <n.icon size={26} className="absolute bottom-2 right-3 text-[#1C252D]" aria-hidden />
                  <span className="absolute left-3 top-2 rounded bg-[#1C252D] px-1.5 text-[11px] font-bold text-white">{n.code}</span>
                </span>
                <span className="flex flex-1 flex-col p-3">
                  <span className="font-display font-bold leading-tight">{n.label}</span>
                  <span className="mt-1 text-xs text-muted">{n.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="chip p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-muted">Sugestão aleatória</p>
            <SourceBadge kind="editorial" />
          </div>
          <h3 key={rnd} className="anim-pop mt-2 font-display text-2xl font-bold leading-tight">{act.title}</h3>
          <p className="mt-1 text-muted">{act.text}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => setRnd((r) => r + 1 + Math.floor(Math.random() * (ACTIVITIES.length - 1)))}><Shuffle size={16} />Outra</button>
            {act.link && <Link className="btn-outline" to={act.link.to}>{act.link.label}</Link>}
          </div>
        </div>
        <div className="chip p-5">
          <p className="text-sm font-bold text-muted">Desafio do dia</p>
          <p className="mt-2 font-display text-2xl font-bold leading-tight">{challenge}</p>
          <Link to="/extras#desafio" className="btn-outline mt-4">Marcar como feito</Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="section-title">Nos cinemas do Brasil</h2>
          {movies && <SourceBadge kind="live" label="TMDB" />}
        </div>
        {movies && movies.length > 0 ? (
          <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {movies.map((m) => (
              <li key={m.id} className="w-32 shrink-0 snap-start">
                <Link to="/cinema" className="block">
                  {m.poster ? <img src={m.poster} alt={`Cartaz de ${m.title}`} loading="lazy" className="aspect-[2/3] w-full rounded-xl border-2 border-ink object-cover" /> : <div className="aspect-[2/3] rounded-xl bg-sunk" />}
                  <p className="mt-1 line-clamp-2 text-sm font-bold">{m.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="chip flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted">Sem fonte de filmes em cartaz configurada neste servidor. Os horários reais estão nos sites dos cinemas, e o módulo de cinema leva até eles.</p>
            <Link to="/cinema" className="btn-dark shrink-0">Abrir Cinema</Link>
          </div>
        )}
        {movies && <p className="mt-2 text-xs text-muted">Filmes e cartazes fornecidos pelo TMDB. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB. Sessões e horários: consulte o cinema.</p>}
      </section>

      <BoredFlow open={bored} onClose={() => setBored(false)} autoPick={auto} />
    </div>
  );
}
