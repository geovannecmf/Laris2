# Relatório técnico: Modo Antitédio

Data: 16/11/2026.

## O que foi implementado

| Módulo | Situação |
|---|---|
| Central Antitédio (home) | Saudação por horário, data/hora em America/Sao_Paulo, tempo atual e 6 dias, recomendação do momento baseada em clima e horário, radar de pintura (procura o próximo dia favorável), cartela de módulos, sugestão aleatória, desafio do dia, filmes em cartaz (quando há TMDB). |
| Estou entediada / Não quero decidir | Filtros de casa/rua, companhia, orçamento, tempo, tipo e interno/externo. Motor de recomendação testado; atividades ao ar livre são bloqueadas com chuva prevista e recebem aviso quando o clima não foi confirmado. "Não quero decidir" escolhe filtros pelo horário e clima. |
| Posso pintar as paredes? | Previsão horária real (Open-Meteo, 16 dias). Configura interna/externa, ambiente (inclui banheiro, cozinha, lavanderia), dia, hora de início, tinta, demãos, horas por demão, intervalo e horas de proteção do fabricante, ventilação. Veredito Favorável / Atenção / Desfavorável / Dados insuficientes, motivos, confiança por antecedência, calendário de 16 dias, linha do tempo hora a hora, blocos 0–24/24–48/48–72 h, critérios explícitos, alertas fixos (sem chuva ≠ parede seca; mofo; vapor; ficha técnica manda) e avaliação manual. |
| Missão Nova Zelândia | CWB/GRU × AKL/WLG/CHC, datas, só ida, passageiros, orçamento. Links preenchidos para Google Voos, Skyscanner, Kayak e Momondo para cada combinação. Registro manual de ofertas com validação, data/hora da consulta, comparador ordenado por preço por pessoa, favoritos, gráfico de histórico, meta de preço com progresso. Espaço de patrocínio vazio e identificado. |
| Cinema em Curitiba | Com TMDB: em cartaz e em breve no Brasil, cartazes, filtro de gênero, busca, duração e classificação indicativa no detalhe. Sem TMDB: avisa a limitação e permite adicionar títulos à mão. Sempre: Cinemark, UCI, Cine Passeio, Cinemateca e "outros", com links de programação e mapa; Ingresso.com. "Escolha nosso filme": votação às cegas a dois. |
| O que fazer em Curitiba? | 39 itens editoriais (27 lugares conhecidos + 12 "buscas no mapa" que não inventam estabelecimento). Filtros por categoria (12), orçamento, região, clima (automático pela previsão), busca sem acento, favoritos, detalhes, mapa, "Me surpreenda", gerador de roteiro por período, compartilhamento. |
| O que assistir hoje? | Com TMDB: discover por plataforma na região BR (JustWatch via TMDB), gênero, duração; detalhe mostra onde assistir (assinatura/aluguel/compra). Sem TMDB: 40 títulos editoriais com sinopses próprias, sem afirmar plataforma, link ao JustWatch. Humor, sorteio, votação a dois, favoritos, assistidos com nota de 1 a 5. |
| Arcade | Snake (toque, swipe, teclado, D-pad, modo sem paredes, pausa automática), Jogo da Velha (2 pessoas ou CPU fácil/médio/impossível com minimax), Quiz (41 perguntas, 6 categorias, rodadas de 10 embaralhadas), Roleta (atividades reais filtradas e sem externas na chuva), Memória e Reflexo. Recordes persistidos. |
| Extras | Desafio do dia (determinístico por data, com sequência), receitas para dois (10), sorteador de onde comer, lista de coisas para fazer, 20 conquistas (3 secretas), compartilhamento (Web Share / área de transferência / WhatsApp), easter eggs (código Konami, 7 toques no logo, coruja da madrugada). |
| Global | Navegação inferior no celular + folha "Mais", trilho lateral no desktop, tema claro/escuro, foco visível, "pular para o conteúdo", folhas modais com Esc e foco preso, `prefers-reduced-motion`, PWA (manifest, ícones, service worker), página 404, error boundary. |

## O que foi testado

- `npm test`: 24 testes unitários passando (avaliador de pintura, links e validação de voos, motor de recomendação, IA do jogo da velha — incluindo 60 partidas aleatórias em que a CPU impossível nunca perde).
- `npm run build`: typecheck e build sem erros nem avisos.
- Playwright (Chromium) contra o build de produção:
  - 14 rotas em 360 px e 1280 px, sem erro de página e **sem overflow horizontal** (dois casos encontrados e corrigidos).
  - Mesmas rotas com a Open-Meteo devolvendo erro 429: estados de erro, botão de tentar de novo e avaliação manual aparecem; nada quebra.
  - 15 verificações de interação, todas passando: fluxo "Estou entediada" e Esc; favorito persiste após recarregar; roteiro; Snake termina ao bater; CPU responde; rodada completa do quiz; roleta sorteia; validação e persistência de oferta; formato do link do Skyscanner; dias chuvosos ficam desfavoráveis no calendário; sorteio de título; votação a dois dá match; conquistas desbloqueiam.
  - Modo escuro inspecionado visualmente.

**Importante sobre os testes com clima:** neste ambiente, a Open-Meteo respondeu "limite diário de requisições excedido" (IP compartilhado). Os testes do caminho feliz usaram uma resposta **sintética** no formato da Open-Meteo, injetada só no Playwright. O app nunca usa dados sintéticos em produção. O parser segue o formato documentado da API, mas a chamada real com sucesso não pôde ser observada daqui.

## Fontes externas

| Fonte | Uso | Chave |
|---|---|---|
| Open-Meteo Forecast API | Clima atual, horário e diário de Curitiba (-25,43; -49,27), fuso America/Sao_Paulo | Não |
| TMDB API (via proxy) | Filmes em cartaz/em breve BR, busca, detalhes, classificação, discover e provedores BR | `TMDB_TOKEN` |
| JustWatch (via TMDB) | Disponibilidade em streaming no Brasil | — |
| Google Voos, Skyscanner, Kayak, Momondo | Links de busca (sem raspagem) | Não |
| Google Maps | Links de busca de lugares | Não |
| Sites dos cinemas, Ingresso.com | Links externos de programação | Não |

## Dados ao vivo × editoriais × demonstrativos

- **Ao vivo:** clima (Open-Meteo); filmes e disponibilidade em streaming só com `TMDB_TOKEN`.
- **Registrados pela pessoa:** preços de passagem, títulos de cinema adicionados à mão, favoritos, listas, notas.
- **Editoriais (marcados na interface):** lugares de Curitiba, atividades, títulos sem TMDB, receitas, quiz, desafios, lista de cinemas. Nenhum preço, avaliação, horário ou endereço de estabelecimento é afirmado; orçamentos são faixas estimadas e rotuladas.
- **Demonstrativos:** nenhum na aplicação. Existe apenas a resposta sintética nos scripts de teste, fora do repositório.

## Precisa de configuração

- `TMDB_TOKEN` no Cloudflare Pages para ativar cinema e streaming ao vivo. **A função e os caminhos com TMDB foram tipados e escritos seguindo a API v3, mas não foram executados aqui** (sem token e sem wrangler). Verifique após configurar.

## Limitações conhecidas

- Não há programação de sessões por cinema: nenhuma fonte aberta e autorizada foi encontrada; o app leva às fontes oficiais.
- Não há API de tarifas aéreas: preços só por registro manual (por escolha, para não inventar).
- A lista "em cartaz" do TMDB é nacional, não por sala de Curitiba.
- Os lugares de Curitiba são curadoria: não há verificação automática de funcionamento.
- A previsão é para um ponto central de Curitiba; microclima do bairro e da parede não entram. O avaliador não mede umidade da superfície.
- Dados ficam só no aparelho (sem sincronização).
- A Open-Meteo gratuita tem limite diário por IP; em redes compartilhadas pode falhar (tratado com mensagem, tentar de novo e avaliação manual).
- O teste de interface foi feito no Chromium; Safari/iOS e Firefox não foram testados.

## Próximas melhorias de maior impacto

1. Configurar `TMDB_TOKEN` e validar cinema/streaming ao vivo em produção.
2. Alertas da meta de preço e do radar de pintura (notificação push do PWA ou e-mail).
3. Integração com uma API de tarifas autorizada (ex.: programa de afiliados) para histórico automático de preços.
4. Agenda cultural de Curitiba a partir de uma fonte oficial (prefeitura/Fundação Cultural), se houver API ou feed aberto.
5. Sincronização opcional entre dois aparelhos (para a votação a dois sem passar o celular).
6. Escolha de bairro para a previsão e suporte a outras cidades.
