/** Ideias editoriais atemporais — não dependem de funcionamento de nenhum lugar. */
export type Where = 'casa' | 'rua';
export type Company = 'sozinha' | 'acompanhada';
export type TimeBox = '15m' | '1h' | 'horas' | 'dia';
export type Vibe = 'relaxante' | 'divertido' | 'cultural' | 'gastronomico' | 'inesperado';
export type Cost = 'gratis' | 'economico' | 'livre';

export interface Activity {
  id: string;
  title: string;
  text: string;
  where: Where;
  outdoor: boolean;
  company: Company[];
  cost: Cost;
  time: TimeBox[];
  vibes: Vibe[];
  link?: { to: string; label: string }; // atalho interno para outro módulo
  placeId?: string; // quando vem do explorador de Curitiba
}

export const ACTIVITIES: Activity[] = [
  { id: 'a-arcade', title: 'Uma partida de Snake valendo a louça', text: 'Melhor de três. Quem perder lava. Sem recurso.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['divertido'], link: { to: '/arcade', label: 'Abrir o Arcade' } },
  { id: 'a-quiz', title: 'Quiz relâmpago', text: 'Dez perguntas aleatórias. Descubra quem sabe mais sobre cinema (e quem só acha que sabe).', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['divertido', 'cultural'], link: { to: '/arcade/quiz', label: 'Começar o quiz' } },
  { id: 'a-filme', title: 'Sessão de cinema no sofá', text: 'Cada um escolhe três filmes, o app cruza os gostos e vocês assistem o que der match.', where: 'casa', outdoor: false, company: ['acompanhada'], cost: 'gratis', time: ['horas'], vibes: ['relaxante', 'cultural'], link: { to: '/assistir', label: 'Escolher o que assistir' } },
  { id: 'a-serie', title: 'Um episódio. Só um. (Mentira.)', text: 'Escolha uma série curta de comédia e se dê permissão para não fazer nada útil.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['1h', 'horas'], vibes: ['relaxante'], link: { to: '/assistir', label: 'Ver sugestões' } },
  { id: 'a-receita', title: 'Cozinhar algo que nunca fizeram', text: 'Sorteie uma receita para dois e transforme a cozinha num programa de culinária sem câmera.', where: 'casa', outdoor: false, company: ['acompanhada', 'sozinha'], cost: 'economico', time: ['1h', 'horas'], vibes: ['gastronomico', 'divertido'], link: { to: '/extras#receitas', label: 'Sortear receita' } },
  { id: 'a-cafe-casa', title: 'Café coado com cerimônia', text: 'Moa o café na hora, aqueça a xícara e beba sem celular. Dez minutos de luxo barato.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['relaxante', 'gastronomico'] },
  { id: 'a-playlist', title: 'Playlist de trocas', text: 'Cada pessoa adiciona cinco músicas que a outra provavelmente não conhece. Ouçam juntas e defendam as escolhas.', where: 'casa', outdoor: false, company: ['acompanhada'], cost: 'gratis', time: ['1h'], vibes: ['divertido', 'cultural'] },
  { id: 'a-roteiro-nz', title: 'Planejar a viagem impossível', text: 'Montem o roteiro dos sonhos na Nova Zelândia. Depois vejam quanto custa de verdade.', where: 'casa', outdoor: false, company: ['acompanhada', 'sozinha'], cost: 'gratis', time: ['1h'], vibes: ['inesperado', 'divertido'], link: { to: '/nova-zelandia', label: 'Abrir Missão NZ' } },
  { id: 'a-desenho', title: 'Retrato em 60 segundos', text: 'Desenhem um ao outro em um minuto, sem olhar para o papel. A exposição é obrigatória.', where: 'casa', outdoor: false, company: ['acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['divertido', 'inesperado'] },
  { id: 'a-alongar', title: 'Alongamento de 15 minutos', text: 'Um vídeo curto de alongamento ou ioga para iniciantes. O corpo agradece, o tédio se ofende.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['relaxante'] },
  { id: 'a-quebra', title: 'Quebra-cabeça ou jogo de tabuleiro', text: 'Se tiver um esquecido no armário, hoje é o dia dele.', where: 'casa', outdoor: false, company: ['acompanhada', 'sozinha'], cost: 'gratis', time: ['horas'], vibes: ['relaxante', 'divertido'] },
  { id: 'a-fotos', title: 'Arqueologia de fotos', text: 'Escolham as dez melhores fotos do ano no celular e contem a história de cada uma.', where: 'casa', outdoor: false, company: ['acompanhada'], cost: 'gratis', time: ['1h'], vibes: ['relaxante', 'inesperado'] },
  { id: 'a-documentario', title: 'Documentário sobre algo aleatório', text: 'Fungos, fontes tipográficas, fábricas de lápis. O mais estranho vence.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['1h', 'horas'], vibes: ['cultural', 'inesperado'], link: { to: '/assistir', label: 'Procurar títulos' } },
  { id: 'a-leitura', title: 'Leitura com chá', text: 'Trinta páginas de um livro parado na estante. Sem pressa e sem marca-texto.', where: 'casa', outdoor: false, company: ['sozinha'], cost: 'gratis', time: ['1h'], vibes: ['relaxante', 'cultural'] },
  { id: 'a-faxina', title: 'Faxina de 15 minutos com cronômetro', text: 'Uma gaveta, um timer, uma música animada. Parece castigo, mas dá uma satisfação absurda.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['inesperado'] },
  { id: 'a-pintar', title: 'Ver se dá pra pintar a parede', text: 'O motivo original deste app existir. Consulte a previsão antes de comprar a tinta.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'economico', time: ['dia'], vibes: ['inesperado'], link: { to: '/pintar', label: 'Abrir o avaliador' } },
  { id: 'a-maratona', title: 'Maratona temática', text: 'Escolham um tema (filmes gravados na Nova Zelândia, por exemplo) e assistam em sequência.', where: 'casa', outdoor: false, company: ['acompanhada', 'sozinha'], cost: 'gratis', time: ['dia'], vibes: ['relaxante', 'cultural'], link: { to: '/assistir', label: 'Montar a maratona' } },
  { id: 'a-pizza-casa', title: 'Pizza caseira competitiva', text: 'Massa pronta, ingredientes divididos. Cada um monta metade, o outro dá nota.', where: 'casa', outdoor: false, company: ['acompanhada'], cost: 'economico', time: ['horas'], vibes: ['gastronomico', 'divertido'] },
  { id: 'a-desafio', title: 'Cumprir o desafio do dia', text: 'Uma missão pequena e meio boba que muda todo dia.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['inesperado', 'divertido'], link: { to: '/extras#desafio', label: 'Ver desafio' } },
  { id: 'a-varanda', title: 'Nuvens na janela', text: 'Dez minutos olhando o céu de Curitiba. Em média, ele muda de ideia três vezes nesse período.', where: 'casa', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['15m'], vibes: ['relaxante', 'inesperado'] },
  { id: 'a-caminhada', title: 'Caminhada sem destino pelo bairro', text: 'Vire numa rua onde nunca entrou. Procure a casa mais estranha.', where: 'rua', outdoor: true, company: ['sozinha', 'acompanhada'], cost: 'gratis', time: ['1h'], vibes: ['relaxante', 'inesperado'] },
  { id: 'a-cinema', title: 'Cinema hoje', text: 'Vejam o que está em cartaz e escolham um filme que agrade às duas pessoas.', where: 'rua', outdoor: false, company: ['acompanhada', 'sozinha'], cost: 'economico', time: ['horas'], vibes: ['cultural', 'divertido'], link: { to: '/cinema', label: 'Ver cinema' } },
  { id: 'a-sorvete', title: 'Sorvete fora de época', text: 'Tomar sorvete em dia frio é o tipo de rebeldia que Curitiba respeita.', where: 'rua', outdoor: false, company: ['sozinha', 'acompanhada'], cost: 'economico', time: ['1h'], vibes: ['gastronomico', 'inesperado'] },
];

export const TIME_LABEL: Record<TimeBox, string> = { '15m': '15 minutos', '1h': '1 hora', horas: 'Algumas horas', dia: 'O dia inteiro' };
export const VIBE_LABEL: Record<Vibe, string> = { relaxante: 'Relaxante', divertido: 'Divertido', cultural: 'Cultural', gastronomico: 'Gastronômico', inesperado: 'Inesperado' };
