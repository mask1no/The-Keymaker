export type Priority = 'low' | 'med' | 'high' | 'vhigh';

export interface Budget {
  c, u, L, imit: number;
  m, i, c, roLamports: number;
}

export function computeBudget(p, r, i, ority: Priority): Budget {
  const cuLimit = 200_000;
  const microLamports =
    priority === 'vhigh'
      ? 800_000
      : priority === 'high'
        ? 300_000
        : priority === 'med'
          ? 100_000
          : 10_000;
  return { cuLimit, microLamports };
}

