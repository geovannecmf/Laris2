/**
 * Proxy serverless (Cloudflare Pages Functions) para a API do TMDB.
 * O token fica só no servidor (variável TMDB_TOKEN = "API Read Access Token" v4).
 * Somente rotas de leitura da lista abaixo são repassadas.
 */
interface Env { TMDB_TOKEN?: string }

const ALLOWED = [
  /^configuration$/,
  /^movie\/now_playing$/,
  /^movie\/upcoming$/,
  /^movie\/\d+$/,
  /^tv\/\d+$/,
  /^movie\/\d+\/(watch\/providers|release_dates)$/,
  /^tv\/\d+\/watch\/providers$/,
  /^discover\/(movie|tv)$/,
  /^search\/(movie|tv|multi)$/,
  /^genre\/(movie|tv)\/list$/,
  /^watch\/providers\/(movie|tv)$/,
];

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...extra } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path ?? '');
  if (!env.TMDB_TOKEN) return json({ configured: false, error: 'TMDB_TOKEN não configurado no servidor.' }, 503);
  if (!ALLOWED.some((r) => r.test(path))) return json({ error: 'Rota não permitida.' }, 404);

  const inUrl = new URL(request.url);
  const out = new URL(`https://api.themoviedb.org/3/${path}`);
  inUrl.searchParams.forEach((v, k) => { if (k !== 'api_key') out.searchParams.set(k, v); });
  if (!out.searchParams.has('language')) out.searchParams.set('language', 'pt-BR');

  const res = await fetch(out.toString(), {
    headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: 'application/json' },
    cf: { cacheTtl: 3600, cacheEverything: true },
  } as RequestInit);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': res.ok ? 'public, max-age=1800' : 'no-store', 'x-antitedio-source': 'tmdb' },
  });
};
