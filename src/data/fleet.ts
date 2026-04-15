import type { Battery } from '../types';

/** 初始电池组状态（共 8 块，分布于 3 个平台） */
export const INITIAL_FLEET: Battery[] = [
  // 平台 A
  { id: 1, platformId: 1, name: 'α-01', soc: 95, st: 'supplying', tp: 0, capacity: 5000, soh: 98, cycles: 342 },
  { id: 2, platformId: 1, name: 'β-02', soc: 80, st: 'standby', tp: 0, capacity: 5000, soh: 96, cycles: 418 },
  { id: 3, platformId: 1, name: 'γ-03', soc: 60, st: 'charging', tp: 0, capacity: 5000, soh: 97, cycles: 285 },
  // 平台 B
  { id: 4, platformId: 2, name: 'δ-04', soc: 72, st: 'supplying', tp: 0, capacity: 5000, soh: 95, cycles: 501 },
  { id: 5, platformId: 2, name: 'ε-05', soc: 45, st: 'charging', tp: 0, capacity: 5000, soh: 94, cycles: 612 },
  { id: 6, platformId: 2, name: 'ζ-06', soc: 88, st: 'standby', tp: 0, capacity: 5000, soh: 99, cycles: 156 },
  // 平台 C
  { id: 7, platformId: 3, name: 'η-07', soc: 55, st: 'supplying', tp: 0, capacity: 5000, soh: 93, cycles: 724 },
  { id: 8, platformId: 3, name: 'θ-08', soc: 100, st: 'standby', tp: 0, capacity: 5000, soh: 97, cycles: 389 },
];

/** 电池组名称索引 */
export const BATTERY_NAMES = INITIAL_FLEET.map((b) => b.name);
