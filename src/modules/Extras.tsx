import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Shuffle, ChefHat, UtensilsCrossed, ListTodo, Trophy, Lock, Trash2, Plus, MapPin } from 'lucide-react';
import { ModuleHeader, SourceBadge, ExtLink, Empty, ShareButton, whatsappUrl } from '../components/ui';
import { useApp } from '../components/AppState';
import { useStored, uid } from '../lib/storage';
import { spNow, daySeed, fmtLongToday } from '../lib/time';
import { CHALLENGES, RECIPES, type Recipe } from '../data/extras';
import { PLACES, mapsUrl, BUDGET_LABEL } from '../data/curitiba';
import { ACHIEVEMENTS } from '../lib/achievements';

interface Todo { id: string; text: string; done: boolean; at: number }

export default function Extras() {
  const { unlock, unlocked, toast, confetti } = useApp();
  const loc = useLocation();
  const today = spNow().date;
  const challenge = CHALLENGES[daySeed(today) % CHALLENGES.length];
  const [doneDays, setDoneDays] = useStored<string[]>('challenge-done', []);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [rTag, setRTag] = useState('todas');
  const [rest, setRest] = useState<(typeof PLACES)[number] | null>(null);
  const [todos, setTodos] = useStored<Todo[]>('todos', []);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!loc.hash) return;
    const el = document.getElementById(loc.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [loc.hash]);

  const tags = ['todas', ...new Set(RECIPES.flatMap((r) => r.tags))];
  const drawRecipe = () => {
    const pool = RECIPES.filter((r) => rTag === 'todas' || r.tags.includes(rTag)).filter((r) => r.id !== recipe?.id);
    setRecipe(pool[Math.floor(Math.random() * pool.length)] ?? RECIPES[0]);
    unlock('recipe');
  };
  const food = PLACES.filter((p) => p.cats.includes('restaurantes') || p.cats.includes('cafes'));
  const streak = (() => { let n = 0; const set = new Set(doneDays); let d = today; while (set.has(d)) { n++; const [y, m, dd] = d.split('-').map(Number); d = new Date(Date.UTC(y, m - 1, dd - 1)).toISOString().slice(0, 10); } return n; })();
  const got = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;

  return (
    <div className="space-y-8">
      <ModuleHeader code="AT-07" name="Lavanda Bônus" color="lavanda" title="Extras" lead="As coisas pequenas que fazem você voltar: desafio do dia, receitas para dois, um sorteador de restaurante, uma lista de planos e as conquistas." />

      <section id="desafio" className="chip scroll-mt-20 overflow-hidden">
        <div className="bg-ipe px-5 py-2 font-display font-bold text-[#1C252D]"><span className="capitalize">{fmtLongToday()}</span></div>
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-muted">Desafio do dia</h2>
          <p className="mt-1 font-display text-3xl font-extrabold leading-tight">{challenge}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className={doneDays.includes(today) ? 'btn-dark' : 'btn-primary'} aria-pressed={doneDays.includes(today)} onClick={() => {
              if (doneDays.includes(today)) { setDoneDays((d) => d.filter((x) => x !== today)); return; }
              setDoneDays((d) => [...d, today]); unlock('challenge'); confetti(); toast('Desafio cumprido', 'ok', 'Amanhã tem outro.');
            }}><Check size={16} />{doneDays.includes(today) ? 'Feito hoje' : 'Marcar como feito'}</button>
            <ShareButton title="Desafio do dia" text={`Desafio antitédio de hoje: ${challenge}`} onDone={(r) => r === 'copied' && toast('Desafio copiado')} />
            <span className="text-sm font-bold text-muted">Sequência: {streak} dia(s)</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="receitas" className="chip scroll-mt-20 p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-display text-xl font-bold"><ChefHat size={20} aria-hidden />Receita para dois</h2><SourceBadge kind="editorial" /></div>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5">{tags.map((t) => <button key={t} className="pill shrink-0 !min-h-[36px] !text-xs" aria-pressed={rTag === t} onClick={() => setRTag(t)}>{t}</button>)}</div>
          <button className="btn-primary mt-3 w-full" onClick={drawRecipe}><Shuffle size={16} />{recipe ? 'Sortear outra' : 'Sortear receita'}</button>
          {recipe ? (
            <article key={recipe.id} className="anim-pop mt-4">
              <h3 className="font-display text-2xl font-extrabold">{recipe.name}</h3>
              <p className="text-sm text-muted">{recipe.time} · {recipe.level} · 2 porções</p>
              <h4 className="mt-3 font-bold">Ingredientes</h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">{recipe.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
              <h4 className="mt-3 font-bold">Modo de fazer</h4>
              <ol className="mt-1 list-decimal space-y-1 pl-5">{recipe.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              <button className="btn-outline mt-3" onClick={() => { setTodos((t) => [...t, { id: uid(), text: `Cozinhar: ${recipe.name}`, done: false, at: Date.now() }]); toast('Adicionado à lista'); }}><Plus size={16} />Pôr na lista</button>
            </article>
          ) : <p className="mt-4 text-muted">Dez receitas simples testadas por gerações de pessoas com fome. Escolha um filtro ou só sorteie.</p>}
        </section>

        <section id="restaurante" className="chip scroll-mt-20 p-5">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-display text-xl font-bold"><UtensilsCrossed size={20} aria-hidden />Sorteador de onde comer</h2><SourceBadge kind="editorial" /></div>
          <p className="mt-1 text-sm text-muted">Sorteia entre tipos de restaurante e lugares conhecidos de Curitiba. O mapa mostra as opções com avaliações atuais.</p>
          <button className="btn-primary mt-3 w-full" onClick={() => setRest(food[Math.floor(Math.random() * food.length)])}><Shuffle size={16} />Sortear</button>
          {rest && (
            <div key={rest.id} className="anim-pop mt-4 rounded-xl border-2 border-ink/20 p-4">
              <p className="font-display text-2xl font-extrabold leading-tight">{rest.name}</p>
              <p className="text-sm text-muted">{rest.blurb}</p>
              <p className="mt-1 text-xs font-bold">Orçamento estimado: {BUDGET_LABEL[rest.budget]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ExtLink href={mapsUrl(rest.maps)} className="btn-dark"><MapPin size={16} />Ver no mapa</ExtLink>
                <ExtLink href={whatsappUrl(`Jantar hoje? Pensei em: ${rest.name}`)} className="btn-ghost">Mandar no WhatsApp</ExtLink>
              </div>
            </div>
          )}
        </section>
      </div>

      <section id="lista" className="chip scroll-mt-20 p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><ListTodo size={20} aria-hidden />Coisas para fazer um dia</h2>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; setTodos((t) => [...t, { id: uid(), text: draft.trim(), done: false, at: Date.now() }]); setDraft(''); }}>
          <label htmlFor="todo" className="sr-only">Novo plano</label>
          <input id="todo" className="field" maxLength={140} placeholder="Ex.: ver o pôr do sol no Tanguá" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="btn-primary shrink-0"><Plus size={16} />Adicionar</button>
        </form>
        {todos.length === 0 ? <div className="mt-4"><Empty title="Lista vazia" text="Anote ideias para não esquecer da próxima vez que o tédio bater." /></div> : (
          <ul className="mt-4 space-y-2">
            {[...todos].sort((a, b) => Number(a.done) - Number(b.done) || b.at - a.at).map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-xl border-2 border-ink/15 bg-surface px-3 py-2">
                <input type="checkbox" id={'t' + t.id} className="h-6 w-6 shrink-0 accent-[rgb(var(--arauc))]" checked={t.done} onChange={() => setTodos((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
                <label htmlFor={'t' + t.id} className={`flex-1 ${t.done ? 'text-muted line-through' : 'font-bold'}`}>{t.text}</label>
                <button className="grid h-10 w-10 place-items-center rounded-lg text-bad" aria-label={`Excluir ${t.text}`} onClick={() => setTodos((all) => all.filter((x) => x.id !== t.id))}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="conquistas" className="scroll-mt-20">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="section-title flex items-center gap-2"><Trophy size={24} aria-hidden />Conquistas</h2>
          <p className="font-display font-bold">{got} de {ACHIEVEMENTS.length}</p>
        </div>
        <div className="mb-4 h-3 overflow-hidden rounded-full border-2 border-ink bg-sunk"><div className="h-full bg-ipe" style={{ width: `${(got / ACHIEVEMENTS.length) * 100}%` }} /></div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const on = !!unlocked[a.id];
            return (
              <li key={a.id} className={`rounded-xl border-2 p-3 ${on ? 'border-ink bg-ipe/25' : 'border-dashed border-ink/25'}`}>
                <p className="flex items-center gap-1.5 font-display font-bold leading-tight">{on ? <Trophy size={16} className="shrink-0 text-ipe" aria-hidden /> : <Lock size={14} className="shrink-0 text-muted" aria-hidden />}{on || !a.secret ? a.name : 'Secreta'}</p>
                <p className="mt-1 text-xs text-muted">{on || !a.secret ? a.hint : 'Continue explorando.'}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">Conquistas, favoritos, listas e recordes ficam salvos só neste aparelho, sem conta e sem servidor.</p>
      </section>
    </div>
  );
}
