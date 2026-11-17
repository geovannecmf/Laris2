import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Info, Thermometer, Droplets, Umbrella, Wind, ChevronDown, Calculator } from 'lucide-react';
import { ModuleHeader, SourceBadge, ErrorBox, Skeleton, Seg, WeatherIcon } from '../components/ui';
import { useApp } from '../components/AppState';
import { useStored } from '../lib/storage';
import { spNow, addDays, fmtDay, weekdayShort, dayNum, monthShort, fmtDateTime } from '../lib/time';
import { evaluatePaint, defaultConfig, manualHours, PAINTS, ROOMS, VERDICT_META, type PaintConfig, type PaintType, type Room, type Verdict, type Level, type HourEval } from '../lib/paint';

const TONE: Record<string, string> = { ok: 'bg-ok text-white', warn: 'bg-warn text-[#1C252D]', bad: 'bg-bad text-white', none: 'bg-sunk text-muted' };
const LV_BG: Record<Level, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', none: 'bg-ink/15' };
const VIcon = ({ v, size = 22 }: { v: Verdict; size?: number }) =>
  v === 'favoravel' ? <CheckCircle2 size={size} aria-hidden /> : v === 'atencao' ? <AlertTriangle size={size} aria-hidden /> : v === 'desfavoravel' ? <XCircle size={size} aria-hidden /> : <HelpCircle size={size} aria-hidden />;

function NumField({ id, label, value, onChange, min, max, step = 1, suffix, hint }: { id: string; label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; suffix?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" className="field pr-12" value={Number.isFinite(value) ? value : ''} min={min} max={max} step={step}
          onChange={(e) => { const n = Number(e.target.value); if (e.target.value === '' || Number.isNaN(n)) return; onChange(Math.min(max, Math.max(min, n))); }} aria-describedby={hint ? id + '-h' : undefined} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">{suffix}</span>}
      </div>
      {hint && <p id={id + '-h'} className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function Paint() {
  const { weather, unlock } = useApp();
  const [params] = useSearchParams();
  const today = spNow().date;
  const [stored, setStored] = useStored<PaintConfig>('paint-config', defaultConfig(addDays(today, 1)));
  const [cfg, setCfg] = useState<PaintConfig>(() => {
    const base = { ...defaultConfig(addDays(today, 1)), ...stored };
    if (base.date < today) base.date = addDays(today, 1);
    const d = params.get('d'); const m = params.get('m');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) base.date = d;
    if (m === 'externa') { base.mode = 'externa'; if (ROOMS[base.room].mode !== 'externa') base.room = 'fachada'; }
    return base;
  });
  useEffect(() => { setStored(cfg); }, [cfg, setStored]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ temp: 20, humidity: 65, rainProb: 20, rainExpected: false });
  const [selHour, setSelHour] = useState<HourEval | null>(null);

  const f = weather.data && !weather.stale ? weather.data : null;
  const set = <K extends keyof PaintConfig>(k: K, v: PaintConfig[K]) => setCfg((p) => ({ ...p, [k]: v }));
  const setPaint = (p: PaintType) => setCfg((c) => ({ ...c, paint: p, coatIntervalH: PAINTS[p].interval, protectionH: PAINTS[p].protection }));
  const setMode = (m: PaintConfig['mode']) => setCfg((c) => ({ ...c, mode: m, room: ROOMS[c.room].mode === m ? c.room : m === 'externa' ? 'fachada' : 'sala' }));

  const result = useMemo(() => (f ? evaluatePaint(cfg, f.hourly, today) : null), [cfg, f, today]);
  const manualResult = useMemo(() => (manualOpen ? evaluatePaint(cfg, manualHours(cfg, manual), today, true) : null), [manualOpen, cfg, manual, today]);
  const shown = manualOpen ? manualResult : result;

  const calendar = useMemo(() => {
    if (!f) return [];
    const days = f.daily.map((d) => d.date).filter((d) => d >= today);
    return days.map((date) => ({ date, r: evaluatePaint({ ...cfg, date }, f.hourly, today), daily: f.daily.find((x) => x.date === date) }));
  }, [cfg, f, today]);

  useEffect(() => {
    if (!result) return;
    unlock('paint');
    if (result.verdict === 'favoravel') unlock('paint-ok');
  }, [result, unlock]);
  useEffect(() => setSelHour(null), [cfg]);

  const rooms = (Object.keys(ROOMS) as Room[]).filter((r) => ROOMS[r].mode === cfg.mode);
  const paints = (Object.keys(PAINTS) as PaintType[]);

  return (
    <div>
      <ModuleHeader code="AT-01" name="Amarelo Ipê" color="ipe" title="Posso pintar as paredes?" lead="Cruzamos a previsão horária de Curitiba com as regras da sua tinta. A resposta vem com motivo, critério e nível de confiança. Promessa de parede perfeita, não.">
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {f ? <SourceBadge kind="live" label={`Open-Meteo, ${fmtDateTime(f.fetchedAt)}`} /> : <span className="tag bg-sunk text-muted">Sem previsão carregada</span>}
          {manualOpen && <SourceBadge kind="manual" label="Avaliação manual" />}
        </div>
      </ModuleHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* CONFIGURAÇÃO */}
        <form className="chip h-fit space-y-5 p-5 lg:sticky lg:top-6" onSubmit={(e) => e.preventDefault()} aria-label="Configuração da pintura">
          <fieldset><legend className="label">Onde vai pintar?</legend>
            <Seg label="Tipo de pintura" value={cfg.mode} onChange={setMode} options={[{ v: 'interna', l: 'Interna' }, { v: 'externa', l: 'Externa' }]} />
          </fieldset>
          <div>
            <label htmlFor="room" className="label">Ambiente</label>
            <select id="room" className="field" value={cfg.room} onChange={(e) => set('room', e.target.value as Room)}>
              {rooms.map((r) => <option key={r} value={r}>{ROOMS[r].label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="date" className="label">Dia</label>
              <input id="date" type="date" className="field" value={cfg.date} min={today} onChange={(e) => e.target.value && set('date', e.target.value)} />
            </div>
            <div>
              <label htmlFor="start" className="label">Começa às</label>
              <select id="start" className="field" value={cfg.startHour} onChange={(e) => set('startHour', Number(e.target.value))}>
                {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}h</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="paint" className="label">Tipo de tinta</label>
            <select id="paint" className="field" value={cfg.paint} onChange={(e) => setPaint(e.target.value as PaintType)}>
              {paints.map((p) => <option key={p} value={p}>{PAINTS[p].label}</option>)}
            </select>
            <p className="mt-1 text-xs text-muted">{PAINTS[cfg.paint].note}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField id="coats" label="Demãos" value={cfg.coats} min={1} max={4} onChange={(n) => set('coats', Math.round(n))} />
            <NumField id="dur" label="Horas por demão" value={cfg.coatDurationH} min={1} max={8} onChange={(n) => set('coatDurationH', Math.round(n))} suffix="h" />
            <NumField id="int" label="Intervalo entre demãos" value={cfg.coatIntervalH} min={1} max={48} onChange={(n) => set('coatIntervalH', Math.round(n))} suffix="h" hint="Do rótulo." />
            <NumField id="prot" label="Proteção após a última" value={cfg.protectionH} min={0} max={96} onChange={(n) => set('protectionH', Math.round(n))} suffix="h" hint="Sem chuva / vapor." />
          </div>
          {cfg.mode === 'interna' && (
            <fieldset><legend className="label">Ventilação do ambiente</legend>
              <Seg label="Ventilação" value={cfg.ventilation} onChange={(v) => set('ventilation', v)} options={[{ v: 'boa', l: 'Boa' }, { v: 'media', l: 'Média' }, { v: 'ruim', l: 'Ruim' }]} />
            </fieldset>
          )}
          <button type="button" className="btn-outline w-full" onClick={() => setManualOpen((o) => !o)} aria-expanded={manualOpen}>
            <Calculator size={16} />{manualOpen ? 'Voltar para a previsão real' : 'Avaliar com meus próprios números'}
          </button>
          {manualOpen && (
            <div className="space-y-3 rounded-xl border-2 border-dashed border-mar/60 p-3">
              <p className="text-sm text-muted">Use quando a previsão não cobre a data ou você tem outra fonte. Os valores valem para toda a janela.</p>
              <div className="grid grid-cols-2 gap-3">
                <NumField id="m-t" label="Temperatura" value={manual.temp} min={-5} max={45} onChange={(n) => setManual((m) => ({ ...m, temp: n }))} suffix="°C" />
                <NumField id="m-h" label="Umidade" value={manual.humidity} min={0} max={100} onChange={(n) => setManual((m) => ({ ...m, humidity: n }))} suffix="%" />
                <NumField id="m-p" label="Chance de chuva" value={manual.rainProb} min={0} max={100} onChange={(n) => setManual((m) => ({ ...m, rainProb: n }))} suffix="%" />
                <label className="flex items-end gap-2 pb-2 text-sm font-bold"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--mar))]" checked={manual.rainExpected} onChange={(e) => setManual((m) => ({ ...m, rainExpected: e.target.checked }))} />Vai chover</label>
              </div>
            </div>
          )}
        </form>

        {/* RESULTADO */}
        <div className="min-w-0 space-y-6">
          {!f && !manualOpen && weather.loading && <div className="space-y-3"><Skeleton className="h-40" /><Skeleton className="h-24" /></div>}
          {!f && !manualOpen && !weather.loading && (
            <ErrorBox title="Não consegui a previsão da Open-Meteo" text={`${weather.error ?? 'Previsão indisponível ou desatualizada.'} Sem dados reais, não dou veredito automático. Você pode tentar de novo ou avaliar com números de outra fonte.`} onRetry={weather.reload}>
              <button className="btn-primary" onClick={() => setManualOpen(true)}><Calculator size={16} />Avaliar manualmente</button>
            </ErrorBox>
          )}

          {f && calendar.length > 0 && (
            <section aria-labelledby="cal">
              <div className="mb-2 flex items-end justify-between">
                <h2 id="cal" className="font-display text-xl font-bold">Calendário dos próximos {calendar.length} dias</h2>
                <p className="hidden text-xs text-muted sm:block">Mesma configuração, dia a dia</p>
              </div>
              <ol className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-8">
                {calendar.map(({ date, r, daily }) => {
                  const tone = VERDICT_META[r.verdict].tone;
                  const sel = date === cfg.date;
                  return (
                    <li key={date}>
                      <button onClick={() => set('date', date)} aria-pressed={sel} aria-label={`${fmtDay(date)}: ${VERDICT_META[r.verdict].label}`}
                        className={`flex w-full flex-col items-center rounded-xl border-2 p-1.5 transition-transform ${sel ? 'border-ink shadow-chipsm -translate-y-0.5' : 'border-ink/15'} bg-surface`}>
                        <span className="text-[11px] font-bold uppercase text-muted">{weekdayShort(date)}</span>
                        <span className="font-display text-xl font-extrabold leading-none">{dayNum(date)}</span>
                        <span className="text-[10px] text-muted">{monthShort(date)}</span>
                        <WeatherIcon code={daily?.code ?? null} size={16} className="my-1 text-muted" />
                        <span className={`mt-0.5 h-2.5 w-full rounded-full ${TONE[tone].split(' ')[0]}`} />
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-ok" />Favorável</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-warn" />Atenção</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-bad" />Desfavorável</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-5 rounded-full bg-sunk" />Dados insuficientes</span>
              </p>
            </section>
          )}

          {shown && (
            <>
              <section className="chip overflow-hidden" aria-live="polite">
                <div className={`flex items-center gap-3 px-5 py-4 ${TONE[VERDICT_META[shown.verdict].tone]}`}>
                  <VIcon v={shown.verdict} size={32} />
                  <div>
                    <p className="font-display text-3xl font-extrabold leading-none">{VERDICT_META[shown.verdict].label}</p>
                    <p className="font-bold opacity-90">{VERDICT_META[shown.verdict].line}</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <p className="font-display text-lg font-bold">{(() => { const d = fmtDay(cfg.date); return d.charAt(0).toUpperCase() + d.slice(1); })()}, a partir das {cfg.startHour}h: {ROOMS[cfg.room].label.toLowerCase()}, {cfg.coats} {cfg.coats > 1 ? 'demãos' : 'demão'} de {PAINTS[cfg.paint].label.split(' (')[0].toLowerCase()}</p>
                  <div className="rounded-xl bg-sunk p-3">
                    <p className="text-sm"><span className="font-bold">Confiança: {shown.confidence.label}.</span> {shown.confidence.detail}</p>
                  </div>
                  <ul className="space-y-2">
                    {shown.reasons.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${r.level === 'ok' ? 'bg-ok' : r.level === 'warn' ? 'bg-warn' : r.level === 'bad' ? 'bg-bad' : 'bg-mar'}`} aria-hidden />
                        <span>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Linha do tempo */}
              <section aria-labelledby="tl" className="chip p-5">
                <h2 id="tl" className="font-display text-xl font-bold">Linha do tempo da janela ({shown.window.totalH} h)</h2>
                <p className="text-sm text-muted">Toque numa hora para ver os números. Faixa de cima: aplicação. Depois: proteção e secagem.</p>
                <div className="no-scrollbar mt-4 overflow-x-auto pb-2">
                  <div className="flex min-w-max gap-[3px]" role="list">
                    {shown.hours.map((h, i) => {
                      const newDay = i === 0 || h.time.slice(0, 10) !== shown.hours[i - 1].time.slice(0, 10);
                      return (
                        <div key={h.time} role="listitem" className="flex flex-col items-center">
                          <span className="h-4 text-[10px] font-bold text-muted">{newDay ? `${dayNum(h.time)}/${h.time.slice(5, 7)}` : ''}</span>
                          <button onClick={() => setSelHour(h)} aria-label={`${Number(h.time.slice(11, 13))}h, ${h.phase === 'aplicacao' ? 'aplicação' : 'secagem'}: ${h.notes.join(', ') || 'sem alertas'}`}
                            className={`w-5 rounded-md border-2 transition-transform ${selHour?.time === h.time ? 'scale-110 border-ink' : 'border-transparent'} ${LV_BG[h.level]} ${h.phase === 'aplicacao' ? 'h-14' : 'h-9 opacity-80'}`} />
                          <span className="mt-0.5 text-[9px] text-muted">{Number(h.time.slice(11, 13))}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {selHour && (
                  <div className="anim-pop mt-3 rounded-xl border-2 border-ink/20 p-3">
                    <p className="font-bold">{fmtDay(selHour.time.slice(0, 10), 'short')}, {Number(selHour.time.slice(11, 13))}h · {selHour.phase === 'aplicacao' ? 'Aplicação' : 'Secagem/proteção'}</p>
                    {selHour.point ? (
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                        <div className="flex items-center gap-1"><Thermometer size={14} aria-hidden /><dt className="sr-only">Temperatura</dt><dd>{selHour.point.temp ?? '–'} °C</dd></div>
                        <div className="flex items-center gap-1"><Droplets size={14} aria-hidden /><dt className="sr-only">Umidade</dt><dd>{selHour.point.humidity ?? '–'}%</dd></div>
                        <div className="flex items-center gap-1"><Umbrella size={14} aria-hidden /><dt className="sr-only">Chuva</dt><dd>{selHour.point.precipProb ?? '–'}% · {selHour.point.precip ?? '–'} mm</dd></div>
                        <div className="flex items-center gap-1"><Wind size={14} aria-hidden /><dt className="sr-only">Vento</dt><dd>{selHour.point.wind != null ? Math.round(selHour.point.wind) : '–'} km/h</dd></div>
                      </dl>
                    ) : <p className="text-sm text-muted">Sem previsão para esta hora.</p>}
                    {selHour.notes.length > 0 && <p className="mt-1 text-sm">{selHour.notes.join(' · ')}</p>}
                  </div>
                )}
                <h3 className="mt-5 font-display font-bold">Depois da última demão</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                  {shown.after.map((a) => (
                    <li key={a.label} className="rounded-xl border-2 border-ink/15 p-3">
                      <p className="flex items-center gap-2 text-sm font-bold"><span className={`h-3 w-3 rounded-full ${LV_BG[a.level]}`} aria-hidden />{a.label}</p>
                      <p className="mt-1 text-sm text-muted">{a.level === 'none' ? 'Fora do alcance da previsão.' : `Chance máx. ${a.maxProb ?? '–'}%, ${a.rainMm ?? '–'} mm previstos.`}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="chip p-5">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Info size={20} aria-hidden />O que a previsão não vê</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {shown.cautions.map((c) => <li key={c}>{c}</li>)}
                </ul>
                <details className="group mt-4 rounded-xl bg-sunk p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-bold">Critérios usados <ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden /></summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {shown.criteria.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <p className="mt-2 text-xs text-muted">Dados: previsão horária da Open-Meteo para Curitiba (-25,43; -49,27), fuso America/Sao_Paulo. Previsão não é medição.</p>
                </details>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
