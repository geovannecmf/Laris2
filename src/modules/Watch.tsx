import { useEffect, useMemo, useState } from 'react';
import { Shuffle, Eye, EyeOff, Star, Tv, Film, Search } from 'lucide-react';
import { ModuleHeader, SourceBadge, Sheet, ExtLink, FavButton, Empty, Loading, ErrorBox, Seg } from '../components/ui';
import { DuoVote } from '../components/DuoVote';
import { useApp } from '../components/AppState';
import { useStored, useIdSet } from '../lib/storage';
import { EDITORIAL_TITLES, MOOD_LABEL, PLATFORMS, justWatchUrl, type Title, type Mood } from '../data/titles';
import { tmdb, tmdbAvailable, fromTmdb, GENRE_IDS } from '../lib/tmdb';
import { spNow } from '../lib/time';

type Kind = 'tanto-faz' | 'filme' | 'serie';
type Dur = 'qualquer' | 'curto' | 'medio' | 'longo';
type Tab = 'descobrir' | 'favoritos' | 'assistidos' | 'votar';
const GENRE_LIST = ['Comédia', 'Drama', 'Romance', 'Suspense', 'Ficção científica', 'Animação', 'Ação', 'Terror', 'Mistério', 'Documentário', 'Fantasia'];

function hue(id: string) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function Poster({ t, className = '' }: { t: Title; className?: string }) {
  if (t.poster) return <img src={t.poster} alt={`Cartaz de ${t.title}`} loading="lazy" className={`aspect-[2/3] w-full rounded-xl border-2 border-ink object-cover ${className}`} />;
  const h = hue(t.id);
  return (
    <div aria-hidden className={`relative flex aspect-[2/3] w-full flex-col justify-between overflow-hidden rounded-xl border-2 border-ink p-2.5 ${className}`} style={{ background: `hsl(${h} 55% 42%)`, color: 'white' }}>
      <span className="text-[10px] font-bold opacity-80">{t.type === 'serie' ? 'SÉRIE' : 'FILME'} {t.year}</span>
      <span className="font-display text-[15px] font-extrabold leading-[1.05]">{t.title}</span>
      <span className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full" style={{ background: `hsl(${(h + 40) % 360} 70% 60% / .55)` }} />
    </div>
  );
}

interface Providers { flatrate?: { provider_name: string }[]; rent?: { provider_name: string }[]; buy?: { provider_name: string }[]; link?: string }

export default function Watch() {
  const { unlock, toast } = useApp();
  const [avail, setAvail] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('descobrir');
  const [platforms, setPlatforms] = useStored<number[]>('watch-platforms', []);
  const [kind, setKind] = useState<Kind>('tanto-faz');
  const [genre, setGenre] = useState('Todos');
  const [mood, setMood] = useState<Mood | 'qualquer'>('qualquer');
  const [dur, setDur] = useState<Dur>('qualquer');
  const [live, setLive] = useState<Title[] | null>(null);
  const [liveErr, setLiveErr] = useState(false);
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState<Title | null>(null);
  const [prov, setProv] = useState<Providers | null | 'loading'>(null);
  const [lucky, setLucky] = useState<Title | null>(null);
  const [known, setKnown] = useStored<Record<string, Title>>('watch-known', {});
  const favs = useIdSet('watch-favs');
  const [watched, setWatched] = useStored<Record<string, { at: number; rating: number | null }>>('watch-watched', {});
  const [q, setQ] = useState('');

  useEffect(() => { tmdbAvailable().then(setAvail); }, []);
  useEffect(() => {
    if (!avail) return;
    let alive = true;
    setLive(null); setLiveErr(false);
    const types: ('movie' | 'tv')[] = kind === 'filme' ? ['movie'] : kind === 'serie' ? ['tv'] : ['movie', 'tv'];
    const gid = genre !== 'Todos' ? GENRE_IDS[genre] : undefined;
    Promise.all(types.map((ty) => tmdb<{ results: unknown[] }>(`discover/${ty}`, {
      watch_region: 'BR', with_watch_providers: platforms.length ? platforms.join('|') : undefined, with_watch_monetization_types: 'flatrate',
      with_genres: gid, sort_by: 'popularity.desc', 'vote_count.gte': 150,
      'with_runtime.lte': ty === 'movie' ? (dur === 'curto' ? 100 : dur === 'medio' ? 130 : undefined) : undefined,
      'with_runtime.gte': ty === 'movie' && dur === 'longo' ? 130 : undefined,
    }).then((j) => j.results.map((r) => fromTmdb(r, ty === 'movie' ? 'filme' : 'serie')))))
      .then((lists) => { if (!alive) return; const mixed = lists.flat().sort(() => 0); setLive(mixed); })
      .catch(() => alive && setLiveErr(true));
    return () => { alive = false; };
  }, [avail, kind, genre, platforms, dur, reload]);

  useEffect(() => {
    if (!open || open.source !== 'tmdb') { setProv(null); return; }
    const [, ty, id] = open.id.split('-');
    let alive = true;
    setProv('loading');
    tmdb<{ results: Record<string, Providers> }>(`${ty === 'filme' ? 'movie' : 'tv'}/${id}/watch/providers`).then((j) => alive && setProv(j.results.BR ?? {})).catch(() => alive && setProv(null));
    return () => { alive = false; };
  }, [open]);

  const editorial = useMemo(() => EDITORIAL_TITLES.filter((t) => {
    if (kind !== 'tanto-faz' && t.type !== kind) return false;
    if (genre !== 'Todos' && !t.genres.includes(genre)) return false;
    if (mood !== 'qualquer' && !t.moods.includes(mood)) return false;
    if (dur !== 'qualquer') {
      const m = t.type === 'serie' ? t.minutes * 2.5 : t.minutes; // série: ~2-3 episódios por sessão
      if (dur === 'curto' && m > 100) return false;
      if (dur === 'medio' && (m <= 100 || m > 130)) return false;
      if (dur === 'longo' && m <= 130) return false;
    }
    if (q.trim() && !t.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [kind, genre, mood, dur, q]);

  const liveFiltered = useMemo(() => (live ?? []).filter((t) => (mood === 'qualquer' || t.moods.includes(mood)) && (!q.trim() || t.title.toLowerCase().includes(q.trim().toLowerCase()))), [live, mood, q]);
  const results = avail ? liveFiltered : editorial;
  const remember = (t: Title) => setKnown((k) => (k[t.id] ? k : { ...k, [t.id]: t }));
  const all = (id: string) => known[id] ?? EDITORIAL_TITLES.find((t) => t.id === id);

  const openT = (t: Title) => { remember(t); setOpen(t); };
  const draw = () => {
    const pool = results.filter((t) => !watched[t.id]);
    const p = (pool.length ? pool : results);
    if (!p.length) { toast('Nada para sortear com esses filtros', 'info'); return; }
    const t = p[Math.floor(Math.random() * p.length)];
    remember(t); setLucky(t);
  };
  const toggleWatched = (t: Title) => setWatched((w) => { const n = { ...w }; if (n[t.id]) delete n[t.id]; else n[t.id] = { at: Date.now(), rating: null }; return n; });
  const night = spNow().hour >= 19;

  const Grid = ({ items }: { items: Title[] }) => (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((t) => (
        <li key={t.id}>
          <button className="block w-full text-left" onClick={() => openT(t)}>
            <Poster t={t} />
            <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-tight">{t.title}</p>
            <p className="text-xs text-muted">{t.type === 'serie' ? 'Série' : 'Filme'}{t.year ? `, ${t.year}` : ''}{watched[t.id] ? ' · visto' : ''}</p>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <ModuleHeader code="AT-05" name="Lavanda Sofá" color="lavanda" title="O que assistir hoje?" lead={night ? 'Já é noite. Escolham algo agora antes que o tempo de decisão ultrapasse a duração do filme.' : 'Filtre por humor, duração e plataforma. Disponibilidade em streaming só aparece quando foi verificada para o Brasil.'}>
        <div className="mt-3 flex flex-wrap gap-2">
          {avail ? <SourceBadge kind="live" label="TMDB + disponibilidade JustWatch (BR)" /> : avail === false ? <SourceBadge kind="editorial" label="Sugestões editoriais: plataforma não verificada" /> : null}
        </div>
      </ModuleHeader>

      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Seções">
        {([['descobrir', 'Descobrir'], ['votar', 'Votação a dois'], ['favoritos', `Favoritos (${favs.ids.length})`], ['assistidos', `Assistidos (${Object.keys(watched).length})`]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`pill shrink-0 ${tab === k ? '!bg-ink !text-bg' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {(tab === 'descobrir' || tab === 'votar') && (
        <div className="chip mb-6 space-y-4 p-4">
          <fieldset><legend className="label">Plataformas que vocês têm</legend>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => <button key={p.id} className="pill !min-h-[36px] !text-xs" aria-pressed={platforms.includes(p.id)} disabled={avail === false} onClick={() => setPlatforms((x) => (x.includes(p.id) ? x.filter((y) => y !== p.id) : [...x, p.id]))}>{p.name}</button>)}
            </div>
            {avail === false && <p className="mt-1 text-xs text-muted">Filtro por plataforma exige a API do TMDB configurada no servidor. Sem ela, não afirmo onde cada título está; cada sugestão traz um link para conferir no JustWatch.</p>}
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <fieldset><legend className="label">Filme ou série</legend><Seg label="Tipo" value={kind} onChange={setKind} options={[{ v: 'tanto-faz', l: 'Tanto faz' }, { v: 'filme', l: 'Filme' }, { v: 'serie', l: 'Série' }]} /></fieldset>
            <fieldset><legend className="label">Duração</legend><Seg label="Duração" value={dur} onChange={setDur} options={[{ v: 'qualquer', l: 'Qualquer' }, { v: 'curto', l: 'Curto' }, { v: 'medio', l: 'Médio' }, { v: 'longo', l: 'Longo' }]} /></fieldset>
          </div>
          <fieldset><legend className="label">Humor</legend><Seg label="Humor" value={mood} onChange={setMood} options={[{ v: 'qualquer', l: 'Qualquer' }, ...(Object.keys(MOOD_LABEL) as Mood[]).map((m) => ({ v: m, l: MOOD_LABEL[m] }))]} /></fieldset>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div><label className="label" htmlFor="wg">Gênero</label><select id="wg" className="field" value={genre} onChange={(e) => setGenre(e.target.value)}><option>Todos</option>{GENRE_LIST.map((g) => <option key={g}>{g}</option>)}</select></div>
            <div><label className="label" htmlFor="wq">Filtrar por nome</label><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden /><input id="wq" className="field pl-9" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
            <div className="flex items-end"><button className="btn-primary w-full" onClick={draw}><Shuffle size={16} />Sortear</button></div>
          </div>
        </div>
      )}

      {tab === 'descobrir' && (
        <section aria-live="polite">
          {avail === null && <Loading />}
          {avail && liveErr && <ErrorBox title="Não consegui buscar títulos no TMDB" text="Enquanto isso, as sugestões editoriais estão logo abaixo." onRetry={() => setReload((r) => r + 1)} />}
          {avail && !live && !liveErr && <Loading label="Procurando títulos…" />}
          {(avail === false || liveErr) && <p className="mb-3 text-sm text-muted">{editorial.length} sugestões editoriais. Plataformas não verificadas.</p>}
          {avail && live && <p className="mb-3 text-sm text-muted">{liveFiltered.length} títulos {platforms.length ? 'disponíveis por assinatura nas plataformas escolhidas no Brasil' : 'populares com streaming no Brasil'}.</p>}
          {(avail === false || liveErr ? editorial : avail && live ? liveFiltered : []).length > 0
            ? <Grid items={avail === false || liveErr ? editorial : liveFiltered} />
            : (avail !== null && (avail === false || live || liveErr)) && <Empty title="Nada com esses filtros" text="Tente outro humor ou duração." />}
          {avail && <p className="mt-4 text-xs text-muted">Dados de títulos e disponibilidade: TMDB e JustWatch. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>}
        </section>
      )}

      {tab === 'votar' && (
        <section className="chip max-w-xl p-5">
          <h2 className="font-display text-xl font-bold">Votação a dois</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Usa os 12 primeiros títulos dos filtros acima.</p>
          <DuoVote key={results.slice(0, 12).map((t) => t.id).join()} items={results.slice(0, 12).map((t) => ({ id: t.id, title: t.title, subtitle: t.synopsis, poster: t.poster }))} storageKey="duo-watch" accent="lavanda" emptyText="Nenhum título com esses filtros." />
        </section>
      )}

      {tab === 'favoritos' && (favs.ids.length ? <Grid items={favs.ids.map(all).filter((x): x is Title => !!x)} /> : <Empty title="Nenhum favorito" text="Toque no coração de um título para guardar aqui." action={<button className="btn-primary" onClick={() => setTab('descobrir')}>Descobrir títulos</button>} />)}

      {tab === 'assistidos' && (Object.keys(watched).length ? (
        <ul className="space-y-2">
          {Object.entries(watched).sort((a, b) => b[1].at - a[1].at).map(([id, w]) => {
            const t = all(id);
            if (!t) return null;
            return (
              <li key={id} className="chip flex items-center gap-3 p-3">
                <div className="w-14 shrink-0"><Poster t={t} /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{t.title}</p>
                  <div className="mt-1 flex gap-0.5" role="radiogroup" aria-label={`Nota para ${t.title}`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} role="radio" aria-checked={w.rating === n} aria-label={`${n} estrela(s)`} className="grid h-9 w-9 place-items-center text-ipe" onClick={() => setWatched((x) => ({ ...x, [id]: { ...w, rating: w.rating === n ? null : n } }))}>
                        <Star size={20} fill={(w.rating ?? 0) >= n ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn-ghost text-sm" onClick={() => toggleWatched(t)}>Remover</button>
              </li>
            );
          })}
        </ul>
      ) : <Empty title="Nada assistido por aqui" text="Marque títulos como assistidos para avaliar depois e o sorteio deixar de sugeri-los." />)}

      <Sheet open={!!lucky} onClose={() => setLucky(null)} title="O sorteio decidiu">
        {lucky && (
          <div className="flex gap-4">
            <div className="w-32 shrink-0"><Poster t={lucky} className="anim-pop" /></div>
            <div>
              <p className="font-display text-2xl font-extrabold leading-tight">{lucky.title}</p>
              <p className="mt-1 text-sm text-muted">{lucky.synopsis}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={draw}><Shuffle size={16} />De novo</button>
                <button className="btn-outline" onClick={() => { setOpen(lucky); setLucky(null); }}>Detalhes</button>
              </div>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-36 shrink-0 self-start"><Poster t={open} /></div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <SourceBadge kind={open.source === 'tmdb' ? 'live' : 'editorial'} label={open.source === 'tmdb' ? 'TMDB' : 'Editorial'} />
                <span className="tag bg-sunk">{open.type === 'serie' ? <Tv size={12} /> : <Film size={12} />}{open.type === 'serie' ? 'Série' : 'Filme'}</span>
                {open.year > 0 && <span className="tag bg-sunk">{open.year}</span>}
                {open.minutes > 0 && <span className="tag bg-sunk">{open.type === 'serie' ? `≈${open.minutes} min/ep.` : `${open.minutes} min`}</span>}
                {open.moods.map((m) => <span key={m} className="tag bg-lavanda/15 text-lavanda">{MOOD_LABEL[m]}</span>)}
                {open.nz && <span className="tag bg-mar/15 text-mar">Feito na Nova Zelândia</span>}
              </div>
              {open.original && open.original !== open.title && <p className="text-sm text-muted">Título original: {open.original}</p>}
              <p className="text-sm font-bold">{open.genres.join(', ')}</p>
              <p>{open.synopsis}</p>
              <div className="rounded-xl bg-sunk p-3 text-sm">
                <p className="font-bold">Onde assistir no Brasil</p>
                {open.source !== 'tmdb' && <p className="text-muted">Não verificado aqui. Consulte a disponibilidade atual:</p>}
                {prov === 'loading' && <p className="text-muted">Consultando…</p>}
                {prov && prov !== 'loading' && (
                  prov.flatrate?.length || prov.rent?.length || prov.buy?.length ? (
                    <ul className="mt-1 space-y-0.5">
                      {prov.flatrate?.length ? <li>Assinatura: <b>{prov.flatrate.map((p) => p.provider_name).join(', ')}</b></li> : null}
                      {prov.rent?.length ? <li>Aluguel: {prov.rent.map((p) => p.provider_name).join(', ')}</li> : null}
                      {prov.buy?.length ? <li>Compra: {prov.buy.map((p) => p.provider_name).join(', ')}</li> : null}
                      <li className="text-xs text-muted">Fonte: JustWatch via TMDB.</li>
                    </ul>
                  ) : <p className="text-muted">Sem streaming registrado para o Brasil agora.</p>
                )}
                <ExtLink href={justWatchUrl(open.title)} className="btn-ghost !min-h-[36px] !px-1 text-sm">Conferir no JustWatch</ExtLink>
              </div>
              <div className="flex flex-wrap gap-2">
                <FavButton active={favs.has(open.id)} onClick={() => { remember(open); favs.toggle(open.id); unlock('fav'); }} label={open.title} />
                <button className="btn-outline" onClick={() => { remember(open); toggleWatched(open); }} aria-pressed={!!watched[open.id]}>{watched[open.id] ? <><EyeOff size={16} />Desmarcar assistido</> : <><Eye size={16} />Já assisti</>}</button>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
