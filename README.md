# Modo Antitédio

> "Você disse que estava entediada. Eu levei a sério."

Aplicação web (PWA) que junta utilidade real e entretenimento: avalia se dá para pintar paredes em Curitiba antes que chova, planeja a busca de passagens para a Nova Zelândia, ajuda a escolher cinema, rolês e o que assistir, e tem seis minigames.

Stack: React 18 + TypeScript + Vite + Tailwind CSS + Lucide. Sem backend obrigatório; uma Pages Function opcional protege a chave do TMDB.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes unitários (Vitest)
npm run build      # typecheck + build de produção em dist/
npm run preview    # serve o build em http://localhost:4173
```

Requisitos: Node 18+ (testado com Node 22).

Sem nenhuma configuração, tudo funciona: previsão do tempo (Open-Meteo, sem chave), avaliador de pintura, Missão NZ, Curitiba, jogos e extras. Cinema e streaming funcionam em modo editorial/manual.

## Variáveis de ambiente

| Variável | Onde | Para quê |
|---|---|---|
| `TMDB_TOKEN` | Cloudflare Pages → Settings → Environment variables (tipo **Secret**) | "API Read Access Token" (v4) do TMDB. Ativa filmes em cartaz no Brasil, busca, cartazes, classificação indicativa e disponibilidade em streaming no Brasil (JustWatch via TMDB). |

O token **nunca** vai para o frontend: o navegador chama `/api/tmdb/*`, e a função `functions/api/tmdb/[[path]].ts` repassa só rotas de leitura de uma lista permitida.

Para testar a função localmente: crie `.dev.vars` com `TMDB_TOKEN=...` e rode `npx wrangler pages dev dist` depois do build.

## Publicar no Cloudflare Pages

1. Conecte o repositório no Cloudflare Pages.
2. Build command: `npm run build` · Output directory: `dist` · Node 18+.
3. (Opcional) adicione `TMDB_TOKEN` como Secret em Production.
4. A pasta `functions/` é detectada automaticamente. `public/_redirects` cuida do roteamento SPA e `public/_headers` dos cabeçalhos de cache/segurança.

Via CLI: `npm run build && npx wrangler pages deploy dist`.

## Estrutura

```
src/
  lib/          regras puras e testadas: paint.ts (avaliador), weather.ts (Open-Meteo),
                recommend.ts (motor de sugestões), flights.ts (links e validação), ttt.ts (IA da velha),
                tmdb.ts (cliente do proxy), storage.ts (localStorage), time.ts (fuso America/Sao_Paulo)
  data/         conteúdo editorial: lugares de Curitiba, atividades, títulos, quiz, receitas, cinemas
  components/   shell, navegação, UI base, fluxo "Estou entediada", votação a dois
  modules/      uma tela por módulo + arcade/ com os seis jogos
functions/      Cloudflare Pages Function (proxy do TMDB)
public/         manifest, service worker, ícones, _redirects, _headers
```

## Decisões técnicas

- **Sem roteamento por hash**: `BrowserRouter` + `_redirects` do Pages, URLs limpas e compartilháveis (`/pintar?d=2026-11-22&m=externa`).
- **Código dividido por módulo** (`React.lazy`): a home carrega ~88 kB gzip; cada módulo/jogo vem sob demanda.
- **Estado local** em `localStorage` com prefixo `mat:` e hook `useStored` sincronizado entre componentes e abas. Sem conta, sem servidor, sem Supabase.
- **Previsão em cache** por 30 min; previsão com mais de 3 h é considerada velha e não é usada para decisões.
- **Procedência sempre visível**: selos "Ao vivo", "Editorial" e "Registrado por você".
- **Sem biblioteca de animação**: transições CSS curtas, todas desligadas com `prefers-reduced-motion`.
- Identidade visual "cartela de tintas": cada módulo é uma amostra de cor (Amarelo Ipê, Azul Mar da Tasmânia, Verde Araucária…), sombras sólidas de adesivo, tipografia Bricolage Grotesque + Atkinson Hyperlegible.

Veja o relatório técnico em [`RELATORIO.md`](RELATORIO.md).
