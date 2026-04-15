import { C } from './colors';
import type { BatteryStatus } from '../types';

/* ── status config ── */
export const BNAME = ['α-01', 'β-02', 'γ-03'];

export const SL: Record<BatteryStatus, string> = {
  supplying: '供电中',
  charging: '充电中',
  to_station: '运往充电站',
  to_platform: '运往平台',
  standby: '平台待命',
  swapping: '换电中',
};

export const SC: Record<BatteryStatus, string> = {
  supplying: C.accent,
  charging: C.blue,
  to_station: C.amber,
  to_platform: C.amber,
  standby: C.cyan,
  swapping: C.purple,
};
