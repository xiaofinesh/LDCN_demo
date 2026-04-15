export const fmt = (h: number, m?: number): string =>
  `${String(Math.floor(h)).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
