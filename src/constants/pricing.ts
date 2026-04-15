import { C } from './colors';
import type { TierInfo, TierName } from '../types';

/* ── electricity pricing ── */
export const TIERS: Record<TierName, TierInfo> = {
  尖峰: { c: C.peak, p: 1.0709 },
  高峰: { c: C.high, p: 0.938 },
  平段: { c: C.flat, p: 0.6642 },
  低谷: { c: C.valley, p: 0.3904 },
  深谷: { c: C.deep, p: 0.3669 },
};

export const SCHED: Array<[number, number, TierName]> = [
  [0, 3, '平段'],
  [3, 7, '低谷'],
  [7, 11, '平段'],
  [11, 12, '低谷'],
  [12, 15, '深谷'],
  [15, 16, '平段'],
  [16, 24, '高峰'],
];

export const tier = (h: number): TierName => {
  for (const [a, b, t] of SCHED) if (h >= a && h < b) return t;
  return '平段';
};
