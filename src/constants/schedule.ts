import { C } from './colors';
import { INITIAL_FLEET } from '../data/fleet';
import type { ScheduleEvent } from '../types';

/**
 * 为 8 块电池按相位自动生成甘特事件。与 simulation.ts 的相位保持一致。
 */
function genEventsFor(batteryId: number): ScheduleEvent[] {
  const phase = ((batteryId - 1) * 3.5) % 24;
  // 相对时间段 → 标签/颜色
  const segments: Array<[number, number, string, string]> = [
    [0, 6, '供电', C.accent],
    [6, 6.25, '换电', C.purple],
    [6.25, 7, '运输→站', C.amber],
    [7, 10, '充电', C.blue],
    [10, 10.75, '运输→台', C.amber],
    [10.75, 14.25, '平台待命', C.cyan],
    [14.25, 14.5, '换电', C.purple],
    [14.5, 24, '供电', C.accent],
  ];

  const out: ScheduleEvent[] = [];
  for (const [rs, re, l, c] of segments) {
    // 映射到绝对 0..24，可能跨越 24 边界 → 拆成两段
    const s = (rs + phase) % 24;
    const e = (re + phase) % 24;
    if (e > s) {
      out.push({ b: batteryId, s, e, l, c });
    } else if (e < s) {
      // 跨界：[s..24] + [0..e]
      if (s < 24) out.push({ b: batteryId, s, e: 24, l, c });
      if (e > 0) out.push({ b: batteryId, s: 0, e, l, c });
    }
  }
  return out;
}

export const EVENTS: ScheduleEvent[] = INITIAL_FLEET.flatMap((b) => genEventsFor(b.id));
