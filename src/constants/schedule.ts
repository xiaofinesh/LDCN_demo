import { C } from './colors';
import type { ScheduleEvent } from '../types';

/* ── schedule events (standby = at platform) ── */
export const EVENTS: ScheduleEvent[] = [
  { b: 1, s: 0, e: 6, l: '供电', c: C.accent },
  { b: 1, s: 6, e: 6.25, l: '换电', c: C.purple },
  { b: 1, s: 6.25, e: 7, l: '运输→站', c: C.amber },
  { b: 1, s: 7, e: 10, l: '充电', c: C.blue },
  { b: 1, s: 10, e: 10.75, l: '运输→台', c: C.amber },
  { b: 1, s: 10.75, e: 14.25, l: '平台待命', c: C.cyan },
  { b: 1, s: 14.25, e: 14.5, l: '换电', c: C.purple },
  { b: 1, s: 14.5, e: 24, l: '供电', c: C.accent },

  { b: 2, s: 0, e: 2.5, l: '平台待命', c: C.cyan },
  { b: 2, s: 2.5, e: 3.25, l: '运输→站', c: C.amber },
  { b: 2, s: 3.25, e: 5.75, l: '充电', c: C.blue },
  { b: 2, s: 5.75, e: 6, l: '运输→台', c: C.amber },
  { b: 2, s: 6, e: 6.25, l: '换电', c: C.purple },
  { b: 2, s: 6.25, e: 14.25, l: '供电', c: C.accent },
  { b: 2, s: 14.25, e: 14.5, l: '换电', c: C.purple },
  { b: 2, s: 14.5, e: 15.25, l: '运输→站', c: C.amber },
  { b: 2, s: 15.25, e: 18.25, l: '充电', c: C.blue },
  { b: 2, s: 18.25, e: 19, l: '运输→台', c: C.amber },
  { b: 2, s: 19, e: 24, l: '平台待命', c: C.cyan },

  { b: 3, s: 0, e: 3, l: '充电', c: C.blue },
  { b: 3, s: 3, e: 3.75, l: '运输→台', c: C.amber },
  { b: 3, s: 3.75, e: 24, l: '平台待命', c: C.cyan },
];
