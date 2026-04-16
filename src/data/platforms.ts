import type { Platform, Station } from '../types';

/**
 * 钻井平台基础负荷：
 * 以 75 天历史日均 12,844 kWh / 平台为基准推算：
 *   12,844 ÷ 24 ≈ 535 kW 平均负荷
 * 三平台分别对应不同钻探强度：A 最高、B 中、C 较低。
 * 日内函数还会叠加 sin 波动 ±180 kW，以模拟钻机启停。
 */
export const PLATFORMS: Platform[] = [
  { id: 1, name: '钻井平台 A', location: '任丘市北部', x: 520, y: 100, baseLoad: 612 },
  { id: 2, name: '钻井平台 B', location: '河间东区', x: 560, y: 240, baseLoad: 528 },
  { id: 3, name: '钻井平台 C', location: '沧县西侧', x: 460, y: 190, baseLoad: 464 },
];

/** 三平台平均基线（kW） */
export const PLATFORM_BASE_TOTAL = PLATFORMS.reduce((a, p) => a + p.baseLoad, 0);

/** 充电站 */
export const STATIONS: Station[] = [
  {
    id: 1,
    name: '中心充电站',
    location: '河间市',
    x: 145,
    y: 315,
    capacity: 1725,
    voltage: '10kV',
  },
  {
    id: 2,
    name: '备用充电站',
    location: '任丘南',
    x: 205,
    y: 160,
    capacity: 860,
    voltage: '10kV',
  },
];
