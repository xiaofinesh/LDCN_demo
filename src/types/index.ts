export type BatteryStatus =
  | 'supplying'
  | 'charging'
  | 'to_station'
  | 'to_platform'
  | 'standby'
  | 'swapping';

export interface Battery {
  id: number;
  soc: number;
  st: BatteryStatus;
  /** transport progress 0-1 */
  tp: number;
}

export interface ScheduleEvent {
  /** battery id */
  b: number;
  /** start hour */
  s: number;
  /** end hour */
  e: number;
  /** label */
  l: string;
  /** color */
  c: string;
}

export type LogKind = 'cmd' | 'warn' | 'ok' | 'info' | 'sys';

export interface LogEntry {
  /** time "HH:MM" */
  t: string;
  /** message */
  m: string;
  /** kind */
  k: LogKind;
}

export interface TierInfo {
  /** color */
  c: string;
  /** price */
  p: number;
}

export type TierName = '尖峰' | '高峰' | '平段' | '低谷' | '深谷';
