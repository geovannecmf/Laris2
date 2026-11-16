/**
 * Curadoria editorial de lugares e programas em Curitiba.
 * São lugares conhecidos e públicos, mas horários, preços e funcionamento
 * mudam: tudo aqui é recomendação editorial SEM confirmação atual.
 * Itens do tipo "busca" não apontam um estabelecimento específico — abrem uma
 * busca no mapa para a pessoa escolher com dados atuais.
 */
export type PlaceCat =
  | 'gratis' | 'natureza' | 'museus' | 'cultura' | 'teatro' | 'cafes' | 'restaurantes'
  | 'jogos' | 'chuva' | 'noite' | 'fimdesemana' | 'diferentes';
export type Budget = 'gratis' | 'economico' | 'medio' | 'livre';
export type Region = 'Centro' | 'Norte' | 'Sul' | 'Leste' | 'Oeste' | 'Várias';

export interface Place {
  id: string;
  name: string;
  kind: 'lugar' | 'busca';
  cats: PlaceCat[];
  region: Region;
  bairro?: string;
  budget: Budget;
  indoor: boolean;
  durationH: number; // tempo típico de visita
  period: ('manha' | 'tarde' | 'noite')[];
  blurb: string;
  tip?: string;
  maps: string; // termo de busca no mapa
}

export const CAT_LABEL: Record<PlaceCat, string> = {
  gratis: 'Grátis', natureza: 'Parques e natureza', museus: 'Museus e exposições', cultura: 'Eventos culturais',
  teatro: 'Teatro e shows', cafes: 'Cafeterias', restaurantes: 'Restaurantes', jogos: 'Jogos e experiências',
  chuva: 'Para dia de chuva', noite: 'Programa noturno', fimdesemana: 'Fim de semana', diferentes: 'Lugares diferentes',
};
export const BUDGET_LABEL: Record<Budget, string> = { gratis: 'Grátis', economico: 'Econômico', medio: 'Médio', livre: 'Sem limite' };

export const PLACES: Place[] = [
  { id: 'jardim-botanico', name: 'Jardim Botânico', kind: 'lugar', cats: ['gratis', 'natureza', 'fimdesemana'], region: 'Leste', bairro: 'Jardim Botânico', budget: 'gratis', indoor: false, durationH: 2, period: ['manha', 'tarde'], blurb: 'A estufa de vidro mais fotografada do Paraná, jardins geométricos e um bosque para andar sem pressa.', tip: 'Cedo tem menos gente na frente da estufa.', maps: 'Jardim Botânico de Curitiba' },
  { id: 'barigui', name: 'Parque Barigui', kind: 'lugar', cats: ['gratis', 'natureza', 'fimdesemana'], region: 'Oeste', bairro: 'Bigorrilho/Mossunguê', budget: 'gratis', indoor: false, durationH: 2, period: ['manha', 'tarde'], blurb: 'Lago, pista de caminhada, capivaras que não pagam aluguel e pôr do sol decente.', maps: 'Parque Barigui Curitiba' },
  { id: 'tangua', name: 'Parque Tanguá', kind: 'lugar', cats: ['gratis', 'natureza', 'diferentes'], region: 'Norte', bairro: 'Pilarzinho', budget: 'gratis', indoor: false, durationH: 1.5, period: ['tarde'], blurb: 'Antiga pedreira com cascata, túnel e mirante. Um dos melhores fins de tarde da cidade.', tip: 'Chegue antes do pôr do sol para pegar o mirante.', maps: 'Parque Tanguá Curitiba' },
  { id: 'tingui', name: 'Parque Tingui e Memorial Ucraniano', kind: 'lugar', cats: ['gratis', 'natureza', 'diferentes'], region: 'Norte', bairro: 'São João', budget: 'gratis', indoor: false, durationH: 1.5, period: ['manha', 'tarde'], blurb: 'Parque às margens do rio Barigui com uma réplica de igreja ucraniana de madeira.', maps: 'Memorial Ucraniano Parque Tingui' },
  { id: 'bosque-alemao', name: 'Bosque Alemão', kind: 'lugar', cats: ['gratis', 'natureza', 'diferentes'], region: 'Norte', bairro: 'Vista Alegre', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'Trilha de João e Maria, torre-mirante e a Casa da Bruxa. Conto de fadas com araucária.', maps: 'Bosque Alemão Curitiba' },
  { id: 'bosque-papa', name: 'Bosque do Papa (João Paulo II)', kind: 'lugar', cats: ['gratis', 'natureza', 'museus'], region: 'Centro', bairro: 'Centro Cívico', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'Casas de troncos que homenageiam a imigração polonesa, ao lado do MON.', maps: 'Bosque do Papa Curitiba' },
  { id: 'sao-lourenco', name: 'Parque São Lourenço', kind: 'lugar', cats: ['gratis', 'natureza'], region: 'Norte', bairro: 'São Lourenço', budget: 'gratis', indoor: false, durationH: 1.5, period: ['manha', 'tarde'], blurb: 'Lago grande, gramado e um centro de criatividade numa antiga fábrica.', maps: 'Parque São Lourenço Curitiba' },
  { id: 'passauna', name: 'Parque Passaúna', kind: 'lugar', cats: ['gratis', 'natureza', 'diferentes'], region: 'Oeste', bairro: 'Butiatuvinha', budget: 'gratis', indoor: false, durationH: 2, period: ['manha', 'tarde'], blurb: 'Represa, mirante e cara de fim de semana no interior sem sair da cidade.', maps: 'Parque Passaúna Curitiba' },
  { id: 'unilivre', name: 'Universidade Livre do Meio Ambiente', kind: 'lugar', cats: ['gratis', 'natureza', 'diferentes'], region: 'Norte', bairro: 'Pilarzinho', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'Torre de troncos em espiral sobre um lago de pedreira. Arquitetura que parece cenário.', maps: 'Unilivre Curitiba' },
  { id: 'opera-arame', name: 'Ópera de Arame', kind: 'lugar', cats: ['teatro', 'diferentes', 'noite'], region: 'Norte', bairro: 'Abranches', budget: 'economico', indoor: false, durationH: 1, period: ['manha', 'tarde', 'noite'], blurb: 'Teatro de estrutura tubular e teto transparente no meio de uma pedreira com lago.', tip: 'Visitação e shows têm regras próprias: confira a agenda oficial.', maps: 'Ópera de Arame Curitiba' },
  { id: 'mon', name: 'Museu Oscar Niemeyer (MON)', kind: 'lugar', cats: ['museus', 'chuva', 'fimdesemana'], region: 'Centro', bairro: 'Centro Cívico', budget: 'economico', indoor: true, durationH: 2.5, period: ['manha', 'tarde'], blurb: 'O "Olho". Exposições grandes de arte e design. Funciona muito bem em dia de chuva.', tip: 'Ingressos e dias de entrada gratuita mudam: confira no site do museu.', maps: 'Museu Oscar Niemeyer' },
  { id: 'museu-paranaense', name: 'Museu Paranaense', kind: 'lugar', cats: ['museus', 'chuva', 'gratis'], region: 'Centro', bairro: 'São Francisco', budget: 'gratis', indoor: true, durationH: 1.5, period: ['manha', 'tarde'], blurb: 'Acervo de história, arqueologia e antropologia do Paraná, perto do Largo da Ordem.', tip: 'Confirme se a entrada segue gratuita e o horário.', maps: 'Museu Paranaense Curitiba' },
  { id: 'solar-barao', name: 'Solar do Barão', kind: 'lugar', cats: ['museus', 'chuva', 'gratis'], region: 'Centro', bairro: 'Centro', budget: 'gratis', indoor: true, durationH: 1, period: ['tarde'], blurb: 'Casarão com gravura, fotografia e exposições temporárias.', maps: 'Solar do Barão Curitiba' },
  { id: 'largo-ordem', name: 'Largo da Ordem e Centro Histórico', kind: 'lugar', cats: ['gratis', 'cultura', 'fimdesemana', 'noite'], region: 'Centro', bairro: 'São Francisco', budget: 'gratis', indoor: false, durationH: 2, period: ['manha', 'tarde', 'noite'], blurb: 'Casario histórico, bares e, aos domingos de manhã, a feira de artesanato.', tip: 'A feira dominical costuma lotar no fim da manhã.', maps: 'Largo da Ordem Curitiba' },
  { id: 'rua-xv', name: 'Rua XV de Novembro (Rua das Flores)', kind: 'lugar', cats: ['gratis', 'diferentes'], region: 'Centro', bairro: 'Centro', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'Calçadão com a Boca Maldita, prédios antigos e o melhor lugar para observar curitibano com pressa.', maps: 'Rua XV de Novembro Curitiba' },
  { id: 'passeio-publico', name: 'Passeio Público', kind: 'lugar', cats: ['gratis', 'natureza'], region: 'Centro', bairro: 'Centro', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'O parque mais antigo da cidade, com lagos e pontes no meio do centro.', maps: 'Passeio Público Curitiba' },
  { id: 'mercado-municipal', name: 'Mercado Municipal', kind: 'lugar', cats: ['restaurantes', 'chuva', 'diferentes'], region: 'Centro', bairro: 'Centro', budget: 'medio', indoor: true, durationH: 1.5, period: ['manha', 'tarde'], blurb: 'Bancas, empórios, setor de orgânicos e lugares para almoçar. Bom para comprar ingrediente de jantar a dois.', tip: 'Fecha cedo em alguns dias: confira o horário.', maps: 'Mercado Municipal de Curitiba' },
  { id: 'santa-felicidade', name: 'Santa Felicidade', kind: 'lugar', cats: ['restaurantes', 'fimdesemana', 'noite'], region: 'Oeste', bairro: 'Santa Felicidade', budget: 'medio', indoor: true, durationH: 2, period: ['tarde', 'noite'], blurb: 'Bairro de imigração italiana famoso pelos restaurantes de rodízio, vinícolas e massas.', maps: 'restaurantes Santa Felicidade Curitiba' },
  { id: 'praca-japao', name: 'Praça do Japão', kind: 'lugar', cats: ['gratis', 'natureza'], region: 'Centro', bairro: 'Água Verde', budget: 'gratis', indoor: false, durationH: 1, period: ['manha', 'tarde'], blurb: 'Lagos com carpas, cerejeiras e um memorial da imigração japonesa.', maps: 'Praça do Japão Curitiba' },
  { id: 'memorial-arabe', name: 'Memorial Árabe e Praça Gibran', kind: 'lugar', cats: ['gratis', 'diferentes'], region: 'Centro', bairro: 'Centro', budget: 'gratis', indoor: false, durationH: 0.5, period: ['manha', 'tarde'], blurb: 'Pequena construção de arquitetura árabe ao lado do Passeio Público. Ótima parada rápida.', maps: 'Memorial Árabe Curitiba' },
  { id: 'teatro-guaira', name: 'Teatro Guaíra', kind: 'lugar', cats: ['teatro', 'cultura', 'noite', 'chuva'], region: 'Centro', bairro: 'Centro', budget: 'medio', indoor: true, durationH: 2.5, period: ['noite'], blurb: 'O grande teatro da cidade: dança, música, espetáculos e o Balé Teatro Guaíra.', tip: 'Programação e ingressos só pelos canais oficiais.', maps: 'Teatro Guaíra' },
  { id: 'teatro-paiol', name: 'Teatro Paiol', kind: 'lugar', cats: ['teatro', 'cultura', 'noite', 'diferentes'], region: 'Centro', bairro: 'Prado Velho', budget: 'economico', indoor: true, durationH: 2, period: ['noite'], blurb: 'Teatro de arena num antigo paiol de pólvora. Pequeno, redondo e intimista.', maps: 'Teatro Paiol Curitiba' },
  { id: 'cinemateca', name: 'Cinemateca de Curitiba', kind: 'lugar', cats: ['cultura', 'chuva', 'noite'], region: 'Centro', bairro: 'São Francisco', budget: 'economico', indoor: true, durationH: 2, period: ['tarde', 'noite'], blurb: 'Mostras, ciclos e filmes fora do circuito comercial.', tip: 'Programação varia: consulte antes.', maps: 'Cinemateca de Curitiba' },
  { id: 'cine-passeio', name: 'Cine Passeio', kind: 'lugar', cats: ['cultura', 'chuva', 'noite'], region: 'Centro', bairro: 'Centro', budget: 'economico', indoor: true, durationH: 2.5, period: ['tarde', 'noite'], blurb: 'Cinema de rua com curadoria, num prédio histórico restaurado no centro.', maps: 'Cine Passeio Curitiba' },
  { id: 'linha-turismo', name: 'Linha Turismo', kind: 'lugar', cats: ['diferentes', 'fimdesemana', 'chuva'], region: 'Várias', budget: 'economico', indoor: true, durationH: 3, period: ['manha', 'tarde'], blurb: 'Ônibus de dois andares que passa pelos principais pontos. Dá para descer e subir de novo.', tip: 'Preço e horários mudam: consulte a prefeitura.', maps: 'Linha Turismo Curitiba Praça Tiradentes' },
  { id: 'torre-panoramica', name: 'Torre Panorâmica', kind: 'lugar', cats: ['diferentes'], region: 'Norte', bairro: 'Mercês', budget: 'economico', indoor: true, durationH: 1, period: ['manha', 'tarde'], blurb: 'Mirante alto com vista de 360° da cidade.', tip: 'Já passou por períodos fechada: confirme se está aberta antes de ir.', maps: 'Torre Panorâmica Curitiba' },
  // Buscas: abrem o mapa com dados atuais, sem inventar um estabelecimento.
  { id: 'busca-cafe-especial', name: 'Cafeterias de café especial', kind: 'busca', cats: ['cafes', 'chuva'], region: 'Várias', budget: 'economico', indoor: true, durationH: 1, period: ['manha', 'tarde'], blurb: 'Curitiba leva café a sério. Abra o mapa, escolha uma com boas avaliações recentes e peça algo que nunca pediu.', maps: 'cafeteria café especial Curitiba' },
  { id: 'busca-confeitaria', name: 'Confeitaria para um café da tarde', kind: 'busca', cats: ['cafes', 'fimdesemana'], region: 'Várias', budget: 'economico', indoor: true, durationH: 1, period: ['tarde'], blurb: 'Torta, café e conversa comprida. O plano mais curitibano possível para tarde nublada.', maps: 'confeitaria café colonial Curitiba' },
  { id: 'busca-escape', name: 'Escape room', kind: 'busca', cats: ['jogos', 'chuva', 'noite'], region: 'Várias', budget: 'medio', indoor: true, durationH: 1.5, period: ['tarde', 'noite'], blurb: 'Sessenta minutos para sair de uma sala trancada. Testa a dupla melhor que qualquer quiz.', maps: 'escape room Curitiba' },
  { id: 'busca-boardgame', name: 'Bar ou café de jogos de tabuleiro', kind: 'busca', cats: ['jogos', 'chuva', 'noite'], region: 'Várias', budget: 'economico', indoor: true, durationH: 2, period: ['tarde', 'noite'], blurb: 'Uma estante de jogos e alguém que explica as regras. Escolha um que nenhum dos dois conhece.', maps: 'board game café Curitiba' },
  { id: 'busca-boliche', name: 'Boliche ou fliperama', kind: 'busca', cats: ['jogos', 'chuva', 'noite'], region: 'Várias', budget: 'medio', indoor: true, durationH: 1.5, period: ['tarde', 'noite'], blurb: 'Competição leve e garantida de risada. Perdedor paga a batata.', maps: 'boliche Curitiba' },
  { id: 'busca-feira', name: 'Feira de rua ou orgânicos', kind: 'busca', cats: ['gratis', 'fimdesemana', 'restaurantes'], region: 'Várias', budget: 'economico', indoor: false, durationH: 1, period: ['manha'], blurb: 'Pastel, fruta da estação e ingrediente para o almoço. Programa de manhã de sábado.', maps: 'feira orgânica Curitiba' },
  { id: 'busca-pizza', name: 'Pizzaria para noite fria', kind: 'busca', cats: ['restaurantes', 'noite', 'chuva'], region: 'Várias', budget: 'medio', indoor: true, durationH: 1.5, period: ['noite'], blurb: 'Curitiba fria pede forno a lenha. Filtre por avaliações recentes.', maps: 'pizzaria forno a lenha Curitiba' },
  { id: 'busca-japones', name: 'Restaurante japonês', kind: 'busca', cats: ['restaurantes', 'noite'], region: 'Várias', budget: 'livre', indoor: true, durationH: 1.5, period: ['noite'], blurb: 'Para quando a conversa pede balcão e omakase, ou só um temaki honesto.', maps: 'restaurante japonês Curitiba' },
  { id: 'busca-hamburguer', name: 'Hamburgueria', kind: 'busca', cats: ['restaurantes', 'noite'], region: 'Várias', budget: 'economico', indoor: true, durationH: 1, period: ['tarde', 'noite'], blurb: 'Infalível, rápido e sem decisão difícil (exceto o molho).', maps: 'hamburgueria Curitiba' },
  { id: 'busca-vegetariano', name: 'Restaurante vegetariano', kind: 'busca', cats: ['restaurantes'], region: 'Várias', budget: 'economico', indoor: true, durationH: 1, period: ['manha', 'tarde'], blurb: 'Almoço leve e colorido para variar a rotina.', maps: 'restaurante vegetariano Curitiba' },
  { id: 'busca-bar-musica', name: 'Bar com música ao vivo', kind: 'busca', cats: ['noite', 'teatro', 'cultura'], region: 'Várias', budget: 'medio', indoor: true, durationH: 2.5, period: ['noite'], blurb: 'Confira a agenda do dia no perfil do bar antes de sair.', maps: 'bar música ao vivo Curitiba' },
  { id: 'busca-vinicola', name: 'Vinícola ou adega na região', kind: 'busca', cats: ['diferentes', 'fimdesemana', 'restaurantes'], region: 'Oeste', budget: 'medio', indoor: true, durationH: 2.5, period: ['tarde'], blurb: 'Degustação perto de Santa Felicidade e arredores. Combine quem volta dirigindo.', maps: 'vinícola Santa Felicidade Curitiba' },
];

export function mapsUrl(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
