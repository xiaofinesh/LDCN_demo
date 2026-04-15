import type { Platform, Station } from '../types';

/** 钻井平台（多平台演示） */
export const PLATFORMS: Platform[] = [
  { id: 1, name: '钻井平台 A', location: '任丘市北部', x: 520, y: 100, baseLoad: 471 },
  { id: 2, name: '钻井平台 B', location: '河间东区', x: 560, y: 240, baseLoad: 392 },
  { id: 3, name: '钻井平台 C', location: '沧县西侧', x: 460, y: 190, baseLoad: 338 },
];

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
