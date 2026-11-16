export type Cell = 'X' | 'O' | null;
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function winner(b: Cell[]): { who: 'X' | 'O' | 'empate'; line: number[] } | null {
  for (const l of LINES) { const [a, c, d] = l; if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a] as 'X' | 'O', line: l }; }
  return b.every(Boolean) ? { who: 'empate', line: [] } : null;
}

function minimax(b: Cell[], me: 'X' | 'O', turn: 'X' | 'O', depth: number): number {
  const w = winner(b);
  if (w) return w.who === 'empate' ? 0 : w.who === me ? 10 - depth : depth - 10;
  const scores: number[] = [];
  for (let i = 0; i < 9; i++) if (!b[i]) { b[i] = turn; scores.push(minimax(b, me, turn === 'X' ? 'O' : 'X', depth + 1)); b[i] = null; }
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

/** Jogada do computador. "facil" erra de propósito; "dificil" é perfeita. */
export function cpuMove(b: Cell[], me: 'X' | 'O', level: 'facil' | 'medio' | 'dificil', rnd = Math.random): number {
  const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return -1;
  const mistake = level === 'facil' ? 0.6 : level === 'medio' ? 0.25 : 0;
  if (rnd() < mistake) return free[Math.floor(rnd() * free.length)];
  let best = -Infinity, move = free[0];
  for (const i of free) {
    const c = [...b]; c[i] = me;
    const s = minimax(c, me, me === 'X' ? 'O' : 'X', 1);
    if (s > best) { best = s; move = i; }
  }
  return move;
}
