import { Home, PaintRoller, Plane, Clapperboard, MapPin, Tv, Gamepad2, Sparkles, type LucideIcon } from 'lucide-react';

export interface NavItem { to: string; label: string; short: string; icon: LucideIcon; color: string; code: string; desc: string }
export const NAV: NavItem[] = [
  { to: '/', label: 'Central Antitédio', short: 'Início', icon: Home, color: 'ipe', code: 'AT-00', desc: 'Tudo o que importa agora.' },
  { to: '/pintar', label: 'Posso pintar as paredes?', short: 'Pintar', icon: PaintRoller, color: 'ipe', code: 'AT-01', desc: 'Previsão real, critérios claros.' },
  { to: '/nova-zelandia', label: 'Missão Nova Zelândia', short: 'Viagem', icon: Plane, color: 'mar', code: 'AT-02', desc: 'Busca, comparação e meta de preço.' },
  { to: '/cinema', label: 'Cinema em Curitiba', short: 'Cinema', icon: Clapperboard, color: 'tomate', code: 'AT-03', desc: 'Em cartaz e escolha a dois.' },
  { to: '/curitiba', label: 'O que fazer em Curitiba?', short: 'Rolês', icon: MapPin, color: 'arauc', code: 'AT-04', desc: 'Lugares, roteiros e surpresas.' },
  { to: '/assistir', label: 'O que assistir hoje?', short: 'Assistir', icon: Tv, color: 'lavanda', code: 'AT-05', desc: 'Filmes e séries para o sofá.' },
  { to: '/arcade', label: 'Arcade Antitédio', short: 'Arcade', icon: Gamepad2, color: 'kiwi', code: 'AT-06', desc: 'Seis jogos de verdade.' },
  { to: '/extras', label: 'Extras', short: 'Extras', icon: Sparkles, color: 'lavanda', code: 'AT-07', desc: 'Desafio, receitas, lista e conquistas.' },
];
export const BOTTOM = ['/', '/pintar', '/curitiba', '/arcade'];
