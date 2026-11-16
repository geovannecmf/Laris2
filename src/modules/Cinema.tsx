import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Ticket, Plus, Trash2, Clock, Film } from 'lucide-react';
import { ModuleHeader, SourceBadge, ExtLink, Sheet, Loading, ErrorBox, Empty, Seg, FavButton } from '../components/ui';
import { DuoVote, type VoteItem } from '../components/DuoVote';
import { useApp } from '../components/AppState';
import { useStored, useIdSet, uid } from '../lib/storage';
import { tmdb, tmdbAvailable, fromTmdb, TmdbUnavailable } from '../lib/tmdb';
import { CINEMAS, TICKET_SITES } from '../data/extras';
import { mapsUrl } from '../data/curitiba';
import type { Title } from '../data/titles';

type Tab = 'cartaz' | 'breve';
interface Detail { runtime?: number; cert?: string; genres: string[] }

export default function Cinema() {
  const { unlock, outlook } = useApp();
  const [avail, setAvail] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('cartaz');
  const [list, setList] = useState<Title[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [genre, setGenre] = useState('Todos');
  const [query, setQuery] = useState('');
  const [searchRes, setSearchRes] = useState<Title[] | null>(null);
  const [open, setOpen] = useState<Title | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [mine, setMine] = useStored<{ id: string; title: string }[]>('cinema-mine', []);
  const [draft, setDraft] = useState('');
  const favs = useIdSet('cinema-favs');
  const [reload, setReload] = useState(0);

  useEffect(() => { tmdbAvailable().then(setAvail); }, []);
  useEffect(() => {
    if (!avail) return;
    let alive = true;
    setList(null); setErr(null);
    tmdb<{ results: unknown[] }>(tab === 'cartaz' ? 'movie/now_playing' : 'movie/upcoming', { region: 'BR' })
      .then((j) => alive && setList(j.results.map((r) => fromTmdb(r, 'filme'))))
      .catch((e) => alive && setErr(e instanceof TmdbUnavailable ? 'A fonte de filmes não está configurada.' : 'Não consegui carregar a lista de filmes.'));
    return () => { alive = false; };
  }, [avail, tab, reload]);

  useEffect(() => {
    if (!open || open.source !== 'tmdb') { setDetail(null); return; }
    const id = open.id.split('-').pop();
    let alive = true;
    Promise.all([tmdb<{ runtime?: number; genres?: { name: string }[] }>(`movie/${id}`), tmdb<{ results: { iso_3166_1: string; release_dates: { certification: string }[] }[] }>(`movie/${id}/release_dates`).catch(() => null)])
      .then(([d, rd]) => {
        if (!alive) return;
        const br = rd?.results.find((r) => r.iso_3166_1 === 'BR');
        const cert = br?.release_dates.map((x) => x.certification).find(Boolean);
        setDetail({ runtime: d.runtime, cert, genres: (d.genres ?? []).map((g) => g.name) });
      }).catch(() => alive && setDetail({ genres: [] }));
    return () => { alive = false; };
  }, [open]);

  const genres = useMemo(() => ['Todos', ...new Set((list ?? []).flatMap((m) => m.genres))].slice(0, 14), [list]);
  const filtered = (list ?? []).filter((m) => genre === 'Todos' || m.genres.includes(genre));

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!avail) { window.open(`https://www.google.com/search?q=${encodeURIComponent(query + ' filme sessões Curitiba')}`, '_blank', 'noopener'); return; }
    setSearchRes(null);
    try {
      const j = await tmdb<{ results: unknown[] }>('search/movie', { query, region: 'BR' });
      setSearchRes(j.results.slice(0, 12).map((r) => fromTmdb(r, 'filme')));
    } catch { setSearchRes([]); }
  };

  const voteItems: VoteItem[] = avail && list
    ? list.slice(0, 12).map((m) => ({ id: m.id, title: m.title, subtitle: m.synopsis, poster: m.poster }))
    : mine.map((m) => ({ id: m.id, title: m.title }));

  const Card = ({ m }: { m: Title }) => (
    <li>
      <button onClick={() => setOpen(m)} className="group block w-full text-left">
        {m.poster ? <img src={m.poster} alt={`Cartaz de ${m.title}`} loading="lazy" className="aspect-[2/3] w-full rounded-xl border-2 border-ink object-cover transition-transform group-active:scale-[.98]" />
          : <div className="grid aspect-[2/3] place-items-center rounded-xl border-2 border-ink bg-tomate/80 p-3 text-center font-display font-bold text-white">{m.title}</div>}
        <p className="mt-1.5 line-clamp-2 font-bold leading-tight">{m.title}</p>
        <p className="text-xs text-muted">{m.genres.slice(0, 2).join(', ') || 'Gênero não informado'}</p>
      </button>
    </li>
  );

  return (
    <div>
      <ModuleHeader code="AT-03" name="Vermelho Poltrona" color="tomate" title="Cinema em Curitiba" lead="Filmes em cartaz no Brasil quando há fonte atualizada, links diretos para as sessões dos cinemas e uma votação para vocês dois concordarem em alguma coisa.">
        <div className="mt-3 flex flex-wrap gap-2">
          {avail ? <SourceBadge kind="live" label="Filmes: TMDB (Brasil)" /> : avail === false ? <span className="tag bg-sunk text-muted">Lista de filmes indisponível neste servidor</span> : null}
          <span className="tag bg-sunk text-muted">Sessões: só nos sites dos cinemas</span>
        </div>
        {outlook.status === 'bad' && <p className="mt-3 rounded-lg bg-mar/10 px-3 py-2 text-sm font-bold text-mar">Chuva prevista nas próximas horas. Cinema nunca pareceu tão sensato.</p>}
      </ModuleHeader>

      <form onSubmit={doSearch} className="mb-6 flex gap-2" role="search">
        <label htmlFor="cq" className="sr-only">Buscar filme</label>
        <input id="cq" className="field" placeholder={avail ? 'Buscar filme pelo nome' : 'Buscar sessões de um filme (abre o Google)'} value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-dark shrink-0"><Search size={16} />Buscar</button>
      </form>
      {searchRes && (
        <section className="mb-8">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Resultados para "{query}"</h2><button className="btn-ghost text-sm" onClick={() => setSearchRes(null)}>Limpar</button></div>
          {searchRes.length ? <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{searchRes.map((m) => <Card key={m.id} m={m} />)}</ul> : <Empty title="Nada encontrado" text="Tente o título original ou outro termo." />}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="cartaz" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="cartaz" className="section-title">{tab === 'cartaz' ? 'Em cartaz no Brasil' : 'Em breve'}</h2>
            {avail && <Seg label="Lista" value={tab} onChange={setTab} options={[{ v: 'cartaz', l: 'Em cartaz' }, { v: 'breve', l: 'Em breve' }]} />}
          </div>
          {avail === null && <Loading label="Verificando a fonte de filmes…" />}
          {avail === false && (
            <div className="chip p-5">
              <p className="font-display text-lg font-bold">Sem lista automática por aqui.</p>
              <p className="mt-1 text-muted">Este servidor não tem a chave do TMDB configurada, então não mostro filmes em cartaz para não arriscar uma lista desatualizada. A programação real está nos cinemas ao lado. Viu algo interessante? Adicione abaixo para votar a dois.</p>
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setMine((p) => [...p, { id: 'u-' + uid(), title: draft.trim() }]); setDraft(''); } }}>
                <label htmlFor="add" className="sr-only">Nome do filme</label>
                <input id="add" className="field" placeholder="Nome do filme que está passando" value={draft} onChange={(e) => setDraft(e.target.value)} />
                <button className="btn-primary shrink-0"><Plus size={16} />Adicionar</button>
              </form>
              {mine.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{mine.map((m) => <li key={m.id} className="pill !cursor-default">{m.title}<button aria-label={`Remover ${m.title}`} onClick={() => setMine((p) => p.filter((x) => x.id !== m.id))}><Trash2 size={14} /></button></li>)}</ul>}
            </div>
          )}
          {avail && err && <ErrorBox title={err} text="Os links dos cinemas continuam funcionando." onRetry={() => setReload((r) => r + 1)} />}
          {avail && !err && !list && <Loading label="Buscando filmes…" />}
          {avail && list && (
            <>
              <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
                {genres.map((g) => <button key={g} className="pill shrink-0" aria-pressed={genre === g} onClick={() => setGenre(g)}>{g}</button>)}
              </div>
              {filtered.length ? <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">{filtered.map((m) => <Card key={m.id} m={m} />)}</ul> : <Empty title="Nenhum filme desse gênero agora" />}
              <p className="mt-3 text-xs text-muted">Lista "em cartaz" do TMDB para a região Brasil: nem todo filme está em todas as salas de Curitiba. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
            </>
          )}
        </section>

        <aside className="space-y-6">
          <section className="chip p-5" aria-labelledby="salas">
            <h2 id="salas" className="font-display text-xl font-bold">Sessões e ingressos</h2>
            <p className="mt-1 text-sm text-muted">Horários mudam toda semana. Confira direto na fonte.</p>
            <ul className="mt-3 space-y-3">
              {CINEMAS.map((c) => (
                <li key={c.id} className="rounded-xl border-2 border-ink/15 p-3">
                  <p className="font-display font-bold">{c.name}</p>
                  <p className="text-sm text-muted">{c.note}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ExtLink href={c.url} className="btn-outline !min-h-[40px] text-sm"><Clock size={14} />Programação</ExtLink>
                    <ExtLink href={mapsUrl(c.maps)} className="btn-ghost !min-h-[40px] text-sm"><MapPin size={14} />Mapa</ExtLink>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">{TICKET_SITES.map((t) => <ExtLink key={t.name} href={t.url} className="btn-dark !min-h-[40px] text-sm"><Ticket size={14} />{t.name}</ExtLink>)}</div>
            <p className="mt-3 text-xs text-muted"><SourceBadge kind="editorial" label="Lista de cinemas: editorial" /> Confirme endereço e funcionamento no site oficial.</p>
          </section>
          <section className="chip p-5" aria-labelledby="duo">
            <h2 id="duo" className="flex items-center gap-2 font-display text-xl font-bold"><Film size={20} aria-hidden />Escolha nosso filme</h2>
            <p className="mb-4 mt-1 text-sm text-muted">Cada pessoa vota sem ver a outra. No fim, o app mostra o que agrada às duas.</p>
            <DuoVote items={voteItems} storageKey={avail ? 'duo-cinema-tmdb' : 'duo-cinema-manual'} accent="tomate" emptyText="Adicione os filmes que estão passando para começar a votação." />
          </section>
        </aside>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''}>
        {open && (
          <div className="flex flex-col gap-4 sm:flex-row">
            {open.poster && <img src={open.poster} alt={`Cartaz de ${open.title}`} className="w-40 self-start rounded-xl border-2 border-ink" />}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <SourceBadge kind="live" label="TMDB" />
                {open.year > 0 && <span className="tag bg-sunk">{open.year}</span>}
                {detail?.runtime ? <span className="tag bg-sunk">{detail.runtime} min</span> : null}
                {detail?.cert ? <span className="tag bg-ink text-bg">Classificação {detail.cert}</span> : detail ? <span className="tag bg-sunk text-muted">Classificação não informada</span> : null}
              </div>
              <p className="text-sm font-bold">{(detail?.genres.length ? detail.genres : open.genres).join(', ')}</p>
              <p>{open.synopsis}</p>
              <div className="flex flex-wrap gap-2">
                <FavButton active={favs.has(open.id)} onClick={() => { favs.toggle(open.id); unlock('fav'); }} label={open.title} />
                <ExtLink href={`https://www.google.com/search?q=${encodeURIComponent(open.title + ' sessões Curitiba')}`} className="btn-primary"><Clock size={16} />Ver sessões em Curitiba</ExtLink>
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
