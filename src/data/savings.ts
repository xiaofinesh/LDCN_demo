import type { SavingsPoint } from '../types';

/** 过去 14 天成本节约趋势（演示数据） */
export const SAVINGS_TREND: SavingsPoint[] = [
  { date: '04-02', before: 9820, after: 8120 },
  { date: '04-03', before: 9950, after: 8240 },
  { date: '04-04', before: 10120, after: 8390 },
  { date: '04-05', before: 9680, after: 7980 },
  { date: '04-06', before: 9890, after: 8040 },
  { date: '04-07', before: 10240, after: 8510 },
  { date: '04-08', before: 10380, after: 8660 },
  { date: '04-09', before: 10120, after: 8280 },
  { date: '04-10', before: 9970, after: 8160 },
  { date: '04-11', before: 10480, after: 8720 },
  { date: '04-12', before: 10620, after: 8830 },
  { date: '04-13', before: 10320, after: 8520 },
  { date: '04-14', before: 10150, after: 8320 },
  { date: '04-15', before: 10280, after: 8570 },
];

/** 24 小时分时负荷曲线（每小时功率 kW） */
export const LOAD_CURVE: number[] = [
  320, 305, 298, 285, 278, 292, 410, 540, 650, 720, 780, 810,
  795, 770, 740, 690, 720, 760, 810, 780, 640, 520, 410, 360,
];

/** 电池健康度分布（按名称） */
export const SOH_DIST: Array<{ name: string; soh: number }> = [
  { name: 'α-01', soh: 98 },
  { name: 'β-02', soh: 96 },
  { name: 'γ-03', soh: 97 },
  { name: 'δ-04', soh: 95 },
  { name: 'ε-05', soh: 94 },
  { name: 'ζ-06', soh: 99 },
  { name: 'η-07', soh: 93 },
  { name: 'θ-08', soh: 97 },
];
