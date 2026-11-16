export interface Recipe { id: string; name: string; time: string; level: 'fácil' | 'médio'; tags: string[]; ingredients: string[]; steps: string[] }

/** Receitas editoriais simples, porções para duas pessoas. */
export const RECIPES: Recipe[] = [
  { id: 'r-carbonara', name: 'Espaguete à carbonara', time: '25 min', level: 'médio', tags: ['massa', 'noite'], ingredients: ['200 g de espaguete', '2 gemas + 1 ovo', '50 g de queijo parmesão ralado', '100 g de bacon ou pancetta em cubos', 'Pimenta-do-reino moída na hora'], steps: ['Cozinhe a massa em água com sal.', 'Doure o bacon numa frigideira sem óleo.', 'Misture ovos, gemas, queijo e bastante pimenta numa tigela.', 'Fora do fogo, junte a massa escorrida ao bacon, depois a mistura de ovos, mexendo rápido com um pouco da água do cozimento até ficar cremoso.'] },
  { id: 'r-shakshuka', name: 'Shakshuka', time: '25 min', level: 'fácil', tags: ['ovos', 'vegetariano', 'brunch'], ingredients: ['1 lata de tomate pelado', '1 cebola e 1 pimentão em tiras', '2 dentes de alho', '1 colher (chá) de cominho e páprica', '4 ovos', 'Pão para acompanhar'], steps: ['Refogue cebola e pimentão até amaciar; junte alho e especiarias.', 'Acrescente o tomate e cozinhe 10 min até engrossar.', 'Abra quatro buracos no molho, quebre os ovos e tampe até as claras firmarem.', 'Sirva na frigideira com pão.'] },
  { id: 'r-risoto', name: 'Risoto de cogumelos', time: '40 min', level: 'médio', tags: ['arroz', 'vegetariano', 'frio'], ingredients: ['1 xícara de arroz arbóreo', '200 g de cogumelos', '1 cebola pequena picada', '1/2 xícara de vinho branco (opcional)', '1 litro de caldo quente', '2 colheres de manteiga e parmesão'], steps: ['Doure os cogumelos e reserve.', 'Refogue a cebola, junte o arroz e mexa 1 min; adicione o vinho.', 'Vá colocando caldo aos poucos, mexendo, por cerca de 18 min.', 'Volte os cogumelos e finalize com manteiga e queijo fora do fogo.'] },
  { id: 'r-tacos', name: 'Tacos de frango', time: '30 min', level: 'fácil', tags: ['divertido', 'noite'], ingredients: ['300 g de frango em tiras', 'Tortilhas pequenas', '1 limão', 'Páprica, cominho, alho', 'Alface, tomate, cebola roxa', 'Creme azedo ou iogurte'], steps: ['Tempere o frango com especiarias, alho e limão.', 'Grelhe em frigideira bem quente.', 'Aqueça as tortilhas.', 'Montem cada um o seu — é parte da diversão.'] },
  { id: 'r-panqueca', name: 'Panquecas americanas', time: '20 min', level: 'fácil', tags: ['doce', 'brunch'], ingredients: ['1 xícara de farinha', '1 ovo', '3/4 xícara de leite', '1 colher (sopa) de açúcar', '1 colher (chá) de fermento', 'Manteiga, mel ou frutas'], steps: ['Misture secos e molhados sem bater demais.', 'Despeje conchas numa frigideira untada em fogo médio.', 'Vire quando aparecerem bolhas na superfície.', 'Empilhe e cubra com o que tiver.'] },
  { id: 'r-curry', name: 'Curry de grão-de-bico', time: '30 min', level: 'fácil', tags: ['vegano', 'frio'], ingredients: ['1 lata de grão-de-bico', '1 caixa de leite de coco', '1 cebola, alho e gengibre', '2 colheres (chá) de curry em pó', '1 tomate picado', 'Arroz para servir'], steps: ['Refogue cebola, alho e gengibre.', 'Junte curry e tomate e cozinhe 3 min.', 'Acrescente o grão-de-bico e o leite de coco; deixe engrossar 10 min.', 'Sirva com arroz e coentro, se gostar.'] },
  { id: 'r-pinhao', name: 'Pinhão cozido na pressão', time: '50 min', level: 'fácil', tags: ['curitiba', 'frio'], ingredients: ['500 g de pinhão', 'Água e sal'], steps: ['Lave os pinhões e coloque na panela de pressão coberta de água com sal.', 'Cozinhe cerca de 40 min após pegar pressão.', 'Espere a pressão sair, escorra e descasque ainda morno.', 'Coma olhando a garoa. É regra.'] },
  { id: 'r-bruschetta', name: 'Bruschetta de tomate', time: '15 min', level: 'fácil', tags: ['petisco', 'rápido'], ingredients: ['1 baguete ou pão italiano', '3 tomates maduros', '1 dente de alho', 'Manjericão', 'Azeite e sal'], steps: ['Toste fatias de pão.', 'Esfregue alho cortado nas fatias quentes.', 'Cubra com tomate picado, manjericão, sal e azeite.'] },
  { id: 'r-fondue', name: 'Fondue de chocolate improvisado', time: '15 min', level: 'fácil', tags: ['doce', 'frio'], ingredients: ['200 g de chocolate meio amargo', '1 caixinha de creme de leite', 'Morango, banana, uva', 'Biscoitos'], steps: ['Derreta o chocolate com o creme de leite em banho-maria ou no micro-ondas, de 30 em 30 segundos.', 'Corte as frutas.', 'Mergulhe com dignidade.'] },
  { id: 'r-poke', name: 'Poke caseiro', time: '30 min', level: 'médio', tags: ['leve', 'calor'], ingredients: ['Arroz japonês cozido', '200 g de salmão fresco ou tofu', 'Pepino, manga, abacate', 'Shoyu, gergelim, cebolinha'], steps: ['Corte a proteína em cubos e tempere com shoyu e gergelim.', 'Monte as tigelas: arroz, proteína e vegetais.', 'Finalize com cebolinha.'] },
];

export const CHALLENGES = [
  'Descobrir uma música lançada no ano em que vocês nasceram e ouvir inteira.',
  'Tomar café em uma xícara que nunca foi usada.',
  'Fazer o caminho de sempre por uma rua diferente.',
  'Mandar uma mensagem para alguém que não fala há meses.',
  'Assistir ao pôr do sol sem fotografar.',
  'Aprender a dizer "obrigado" em maori: "kia ora" também serve como olá.',
  'Cozinhar algo usando só o que já tem em casa.',
  'Ler a primeira página de cinco livros diferentes.',
  'Ficar 10 minutos sem celular e anotar o que pensou.',
  'Desenhar o mapa do bairro de memória e depois conferir.',
  'Bater o seu recorde no Snake.',
  'Descobrir o nome de uma árvore da sua rua.',
  'Organizar só uma gaveta. Só uma.',
  'Escolher um filme pelo pôster, sem ler a sinopse.',
  'Fazer uma playlist com exatamente 7 músicas para dia de garoa.',
  'Experimentar uma fruta que nunca comeu.',
  'Escrever três coisas boas que aconteceram nesta semana.',
  'Acertar 8 de 10 no quiz do Arcade.',
  'Andar até um parque e contar quantas espécies de pássaro aparecem.',
  'Pesquisar quanto custa ir para a Nova Zelândia em março. Respirar fundo.',
];

/** Redes e cinemas conhecidos em Curitiba (editorial). Programação SEMPRE nos sites oficiais. */
export const CINEMAS = [
  { id: 'cinemark', name: 'Cinemark', note: 'Rede com salas em shoppings da cidade.', url: 'https://www.cinemark.com.br/', maps: 'Cinemark Curitiba' },
  { id: 'uci', name: 'UCI', note: 'Rede com salas em shoppings da cidade.', url: 'https://www.ucicinemas.com.br/', maps: 'UCI cinemas Curitiba' },
  { id: 'cinepasseio', name: 'Cine Passeio', note: 'Cinema de rua no Centro, com curadoria e preços populares.', url: 'https://www.google.com/search?q=Cine+Passeio+Curitiba+programa%C3%A7%C3%A3o', maps: 'Cine Passeio Curitiba' },
  { id: 'cinemateca', name: 'Cinemateca de Curitiba', note: 'Mostras e ciclos, no São Francisco.', url: 'https://www.google.com/search?q=Cinemateca+de+Curitiba+programa%C3%A7%C3%A3o', maps: 'Cinemateca de Curitiba' },
  { id: 'outros', name: 'Outros cinemas da cidade', note: 'Veja todas as salas perto de você no mapa.', url: 'https://www.google.com/search?q=cinemas+em+Curitiba+programa%C3%A7%C3%A3o', maps: 'cinema Curitiba' },
];
export const TICKET_SITES = [
  { name: 'Ingresso.com', url: 'https://www.ingresso.com/' },
  { name: 'Busca de sessões no Google', url: 'https://www.google.com/search?q=filmes+em+cartaz+Curitiba' },
];
