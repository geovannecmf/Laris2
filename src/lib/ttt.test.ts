import { describe, it, expect } from 'vitest';
import { winner, cpuMove, type Cell } from './ttt';

describe('jogo da velha', () => {
  it('detecta vitória e empate', () => {
    expect(winner(['X', 'X', 'X', null, null, null, null, null, null])?.who).toBe('X');
    expect(winner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'])?.who).toBe('empate');
    expect(winner(Array(9).fill(null))).toBeNull();
  });
  it('CPU difícil completa a vitória e bloqueia', () => {
    const win: Cell[] = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(cpuMove(win, 'O', 'dificil')).toBe(2);
    const block: Cell[] = ['X', 'X', null, null, 'O', null, null, null, null];
    expect(cpuMove(block, 'O', 'dificil')).toBe(2);
  });
  it('CPU difícil nunca perde (jogos aleatórios)', () => {
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let g = 0; g < 60; g++) {
      const b: Cell[] = Array(9).fill(null); let turn: 'X' | 'O' = 'X';
      while (!winner(b)) {
        const i = turn === 'O' ? cpuMove(b, 'O', 'dificil') : (() => { const f = b.map((c, k) => (c ? -1 : k)).filter((k) => k >= 0); return f[Math.floor(rnd() * f.length)]; })();
        b[i] = turn; turn = turn === 'X' ? 'O' : 'X';
      }
      expect(winner(b)?.who).not.toBe('X');
    }
  });
});
