/**
 * Sugestões editoriais de filmes e séries (sinopses próprias, curtas).
 * NÃO afirmam em qual streaming o título está: a disponibilidade no Brasil
 * muda e deve ser consultada (link para o JustWatch) ou vir da API do TMDB.
 */
export type Mood = 'leve' | 'intenso' | 'engracado' | 'romantico' | 'surpreendente';
export interface Title {
  id: string;
  title: string;
  original?: string;
  year: number;
  type: 'filme' | 'serie';
  genres: string[];
  moods: Mood[];
  minutes: number; // filme: duração; série: duração média do episódio (aprox.)
  synopsis: string;
  nz?: boolean; // gravado ou criado na Nova Zelândia
  poster?: string; // apenas quando vem do TMDB
  source: 'editorial' | 'tmdb';
}

export const MOOD_LABEL: Record<Mood, string> = { leve: 'Leve', intenso: 'Intenso', engracado: 'Engraçado', romantico: 'Romântico', surpreendente: 'Surpreendente' };

const t = (x: Omit<Title, 'source'>): Title => ({ ...x, source: 'editorial' });

export const EDITORIAL_TITLES: Title[] = [
  t({ id: 'e-amelie', title: 'O Fabuloso Destino de Amélie Poulain', year: 2001, type: 'filme', genres: ['Romance', 'Comédia'], moods: ['leve', 'romantico'], minutes: 122, synopsis: 'Uma garçonete tímida de Montmartre decide consertar a vida dos outros em segredo, enquanto esquece da própria.' }),
  t({ id: 'e-parasita', title: 'Parasita', year: 2019, type: 'filme', genres: ['Suspense', 'Drama'], moods: ['intenso', 'surpreendente'], minutes: 132, synopsis: 'Uma família pobre se infiltra, um por um, na casa de uma família rica. Daí para frente, nada é o que parece.' }),
  t({ id: 'e-about-time', title: 'Questão de Tempo', original: 'About Time', year: 2013, type: 'filme', genres: ['Romance', 'Comédia'], moods: ['romantico', 'leve'], minutes: 123, synopsis: 'Um rapaz descobre que pode voltar no tempo e usa o dom para algo surpreendentemente pequeno: viver melhor os dias comuns.' }),
  t({ id: 'e-budapeste', title: 'O Grande Hotel Budapeste', year: 2014, type: 'filme', genres: ['Comédia', 'Aventura'], moods: ['engracado', 'leve'], minutes: 99, synopsis: 'Um concierge impecável e seu jovem aprendiz se metem numa disputa por uma pintura valiosa, numa Europa de confeitaria.' }),
  t({ id: 'e-eeaao', title: 'Tudo em Todo Lugar ao Mesmo Tempo', year: 2022, type: 'filme', genres: ['Ficção científica', 'Ação', 'Comédia'], moods: ['surpreendente', 'engracado', 'intenso'], minutes: 139, synopsis: 'Uma dona de lavanderia atolada em impostos descobre que precisa salvar o multiverso. Com salsichas nos dedos.' }),
  t({ id: 'e-arrival', title: 'A Chegada', original: 'Arrival', year: 2016, type: 'filme', genres: ['Ficção científica', 'Drama'], moods: ['intenso', 'surpreendente'], minutes: 116, synopsis: 'Uma linguista é chamada para conversar com visitantes extraterrestres e acaba mudando a própria noção de tempo.' }),
  t({ id: 'e-central', title: 'Central do Brasil', year: 1998, type: 'filme', genres: ['Drama'], moods: ['intenso'], minutes: 113, synopsis: 'Uma escritora de cartas da estação acompanha um menino pelo sertão em busca do pai que ele nunca conheceu.' }),
  t({ id: 'e-compadecida', title: 'O Auto da Compadecida', year: 2000, type: 'filme', genres: ['Comédia'], moods: ['engracado', 'leve'], minutes: 104, synopsis: 'João Grilo e Chicó aplicam golpes no sertão até o julgamento final. "Não sei, só sei que foi assim."' }),
  t({ id: 'e-cidade-deus', title: 'Cidade de Deus', year: 2002, type: 'filme', genres: ['Drama', 'Crime'], moods: ['intenso'], minutes: 130, synopsis: 'Décadas de uma comunidade carioca contadas por um garoto que quer ser fotógrafo.' }),
  t({ id: 'e-before-sunrise', title: 'Antes do Amanhecer', original: 'Before Sunrise', year: 1995, type: 'filme', genres: ['Romance', 'Drama'], moods: ['romantico', 'leve'], minutes: 101, synopsis: 'Dois desconhecidos descem de um trem em Viena e passam a noite conversando. Só isso, e é tudo.' }),
  t({ id: 'e-knives-out', title: 'Entre Facas e Segredos', original: 'Knives Out', year: 2019, type: 'filme', genres: ['Mistério', 'Comédia'], moods: ['engracado', 'surpreendente'], minutes: 130, synopsis: 'Um escritor de romances policiais morre no aniversário e toda a família vira suspeita. O detetive tem sotaque.' }),
  t({ id: 'e-chihiro', title: 'A Viagem de Chihiro', year: 2001, type: 'filme', genres: ['Animação', 'Fantasia'], moods: ['surpreendente', 'leve'], minutes: 125, synopsis: 'Uma menina vai parar numa casa de banhos para espíritos e precisa trabalhar para salvar os pais.' }),
  t({ id: 'e-totoro', title: 'Meu Vizinho Totoro', year: 1988, type: 'filme', genres: ['Animação', 'Família'], moods: ['leve'], minutes: 86, synopsis: 'Duas irmãs se mudam para o interior e fazem amizade com um espírito gigante e fofo da floresta.' }),
  t({ id: 'e-inside-out', title: 'Divertida Mente', year: 2015, type: 'filme', genres: ['Animação', 'Comédia'], moods: ['leve', 'engracado'], minutes: 95, synopsis: 'As emoções de uma menina disputam o painel de controle quando a família muda de cidade.' }),
  t({ id: 'e-lotr', title: 'O Senhor dos Anéis: A Sociedade do Anel', year: 2001, type: 'filme', genres: ['Fantasia', 'Aventura'], moods: ['intenso', 'surpreendente'], minutes: 178, synopsis: 'Um hobbit herda um anel perigoso e parte numa jornada para destruí-lo. Paisagens gravadas na Nova Zelândia.', nz: true }),
  t({ id: 'e-shadows', title: 'O Que Fazemos nas Sombras', original: 'What We Do in the Shadows', year: 2014, type: 'filme', genres: ['Comédia', 'Terror'], moods: ['engracado', 'surpreendente'], minutes: 86, synopsis: 'Falso documentário sobre vampiros que dividem uma casa em Wellington e brigam por causa da louça.', nz: true }),
  t({ id: 'e-wilderpeople', title: 'A Incrível Aventura de Rick Baker', original: 'Hunt for the Wilderpeople', year: 2016, type: 'filme', genres: ['Comédia', 'Aventura'], moods: ['engracado', 'leve'], minutes: 101, synopsis: 'Um garoto da cidade e seu tio rabugento viram fugitivos na mata neozelandesa. Haikus incluídos.', nz: true }),
  t({ id: 'e-lalaland', title: 'La La Land: Cantando Estações', year: 2016, type: 'filme', genres: ['Musical', 'Romance'], moods: ['romantico', 'intenso'], minutes: 128, synopsis: 'Uma atriz e um pianista de jazz se apaixonam em Los Angeles, enquanto perseguem sonhos que puxam para lados diferentes.' }),
  t({ id: 'e-get-out', title: 'Corra!', original: 'Get Out', year: 2017, type: 'filme', genres: ['Terror', 'Suspense'], moods: ['intenso', 'surpreendente'], minutes: 104, synopsis: 'Um fim de semana na casa dos pais da namorada fica cada vez mais estranho.' }),
  t({ id: 'e-interstellar', title: 'Interestelar', year: 2014, type: 'filme', genres: ['Ficção científica', 'Drama'], moods: ['intenso'], minutes: 169, synopsis: 'Com a Terra morrendo, um ex-piloto atravessa um buraco de minhoca em busca de um novo lar.' }),
  t({ id: 'e-madmax', title: 'Mad Max: Estrada da Fúria', year: 2015, type: 'filme', genres: ['Ação'], moods: ['intenso'], minutes: 120, synopsis: 'Duas horas de perseguição no deserto, com um guitarrista lança-chamas. Você não vai piscar.' }),
  t({ id: 'e-ainda', title: 'Ainda Estou Aqui', year: 2024, type: 'filme', genres: ['Drama'], moods: ['intenso'], minutes: 137, synopsis: 'Durante a ditadura, uma mãe reorganiza a vida da família depois que o marido é levado e não volta.' }),
  t({ id: 'e-eternal', title: 'Brilho Eterno de uma Mente sem Lembranças', year: 2004, type: 'filme', genres: ['Romance', 'Ficção científica'], moods: ['romantico', 'surpreendente'], minutes: 108, synopsis: 'Depois de um término, um homem decide apagar a ex da memória e se arrepende no meio do processo.' }),
  t({ id: 'e-bacurau', title: 'Bacurau', year: 2019, type: 'filme', genres: ['Suspense', 'Faroeste'], moods: ['surpreendente', 'intenso'], minutes: 131, synopsis: 'Um povoado do sertão some do mapa, e coisas muito estranhas começam a acontecer.' }),
  t({ id: 'e-paddington2', title: 'As Aventuras de Paddington 2', year: 2017, type: 'filme', genres: ['Família', 'Comédia'], moods: ['leve', 'engracado'], minutes: 103, synopsis: 'Um urso educadíssimo é preso injustamente e transforma a cadeia num lugar mais gentil.' }),
  t({ id: 'e-prada', title: 'O Diabo Veste Prada', year: 2006, type: 'filme', genres: ['Comédia', 'Drama'], moods: ['engracado', 'leve'], minutes: 109, synopsis: 'Uma jornalista recém-formada vira assistente da editora mais temida da moda.' }),
  t({ id: 'e-office', title: 'The Office', year: 2005, type: 'serie', genres: ['Comédia'], moods: ['engracado', 'leve'], minutes: 22, synopsis: 'Falso documentário num escritório de papel onde o chefe é o maior problema.' }),
  t({ id: 'e-fleabag', title: 'Fleabag', year: 2016, type: 'serie', genres: ['Comédia', 'Drama'], moods: ['engracado', 'intenso'], minutes: 27, synopsis: 'Uma mulher caótica em Londres conversa com a câmera enquanto tenta não destruir tudo à volta.' }),
  t({ id: 'e-dark', title: 'Dark', year: 2017, type: 'serie', genres: ['Ficção científica', 'Mistério'], moods: ['intenso', 'surpreendente'], minutes: 60, synopsis: 'O sumiço de uma criança numa cidade alemã revela um nó que atravessa várias gerações. Tenha um caderno.' }),
  t({ id: 'e-lasso', title: 'Ted Lasso', year: 2020, type: 'serie', genres: ['Comédia'], moods: ['leve', 'engracado'], minutes: 35, synopsis: 'Um técnico de futebol americano é contratado para treinar um time inglês de futebol. Sem saber as regras.' }),
  t({ id: 'e-severance', title: 'Ruptura', original: 'Severance', year: 2022, type: 'serie', genres: ['Suspense', 'Ficção científica'], moods: ['surpreendente', 'intenso'], minutes: 50, synopsis: 'Funcionários têm a memória dividida entre trabalho e vida pessoal. Ninguém sabe o que a empresa faz.' }),
  t({ id: 'e-b99', title: 'Brooklyn Nine-Nine', year: 2013, type: 'serie', genres: ['Comédia'], moods: ['engracado', 'leve'], minutes: 22, synopsis: 'Uma delegacia de Nova York com detetives competentes, mas não necessariamente maduros.' }),
  t({ id: 'e-normal', title: 'Normal People', year: 2020, type: 'serie', genres: ['Romance', 'Drama'], moods: ['romantico', 'intenso'], minutes: 30, synopsis: 'Dois jovens irlandeses se aproximam e se afastam ao longo dos anos de escola e faculdade.' }),
  t({ id: 'e-chernobyl', title: 'Chernobyl', year: 2019, type: 'serie', genres: ['Drama', 'Histórico'], moods: ['intenso'], minutes: 65, synopsis: 'Minissérie sobre o acidente nuclear de 1986 e as pessoas que tentaram contê-lo.' }),
  t({ id: 'e-goodplace', title: 'The Good Place', year: 2016, type: 'serie', genres: ['Comédia', 'Fantasia'], moods: ['engracado', 'surpreendente'], minutes: 22, synopsis: 'Uma mulher acorda no paraíso por engano e tenta virar boa pessoa antes que descubram.' }),
  t({ id: 'e-bear', title: 'O Urso', original: 'The Bear', year: 2022, type: 'serie', genres: ['Drama', 'Comédia'], moods: ['intenso'], minutes: 30, synopsis: 'Um chef premiado volta para tocar a lanchonete caótica da família em Chicago. Sim, chef.' }),
  t({ id: 'e-conchords', title: 'Flight of the Conchords', year: 2007, type: 'serie', genres: ['Comédia', 'Musical'], moods: ['engracado', 'leve'], minutes: 30, synopsis: 'Uma dupla folk neozelandesa tenta, sem sucesso nenhum, fazer carreira em Nova York.', nz: true }),
  t({ id: 'e-stranger', title: 'Stranger Things', year: 2016, type: 'serie', genres: ['Ficção científica', 'Terror'], moods: ['surpreendente', 'intenso'], minutes: 50, synopsis: 'Nos anos 80, o sumiço de um garoto revela experimentos secretos e um mundo invertido.' }),
  t({ id: 'e-blackmirror', title: 'Black Mirror', year: 2011, type: 'serie', genres: ['Ficção científica', 'Suspense'], moods: ['surpreendente', 'intenso'], minutes: 60, synopsis: 'Episódios independentes sobre tecnologia dando muito errado. Escolha um e debata depois.' }),
  t({ id: 'e-bridgerton', title: 'Bridgerton', year: 2020, type: 'serie', genres: ['Romance', 'Drama'], moods: ['romantico', 'leve'], minutes: 60, synopsis: 'Bailes, fofoca anônima e casamentos arranjados na alta sociedade de Londres do século XIX.' }),
];

export const PLATFORMS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Prime Video' },
  { id: 337, name: 'Disney+' },
  { id: 1899, name: 'Max' },
  { id: 350, name: 'Apple TV+' },
  { id: 307, name: 'Globoplay' },
  { id: 531, name: 'Paramount+' },
  { id: 283, name: 'Crunchyroll' },
];

export function justWatchUrl(title: string) {
  return `https://www.justwatch.com/br/busca?q=${encodeURIComponent(title)}`;
}
