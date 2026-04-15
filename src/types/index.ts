export type BatteryStatus =
  | 'supplying'
  | 'charging'
  | 'to_station'
  | 'to_platform'
  | 'standby'
  | 'swapping';

export interface Battery {
  id: number;
  /** 所属平台 id */
  platformId: number;
  /** 显示名 α-01 */
  name: string;
  soc: number;
  st: BatteryStatus;
  /** transport progress 0-1 */
  tp: number;
  /** 总容量 kWh */
  capacity: number;
  /** 健康度 % */
  soh: number;
  /** 累计循环次数 */
  cycles: number;
}

export interface Platform {
  id: number;
  name: string;
  location: string;
  /** 地图坐标（SVG 坐标系） */
  x: number;
  y: number;
  /** 基础负荷 kW */
  baseLoad: number;
  /** 当前装机电池数（运行时计算） */
  online?: number;
}

export interface Station {
  id: number;
  name: string;
  location: string;
  x: number;
  y: number;
  /** 装机功率 kW */
  capacity: number;
  voltage: string;
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
  /** 电池 id（可选） */
  b?: number;
}

export type AlertLevel = 'info' | 'warn' | 'critical';

export interface AlertItem {
  id: string;
  /** 触发时间 HH:MM */
  t: string;
  level: AlertLevel;
  title: string;
  detail: string;
  /** 关联电池 id */
  batteryId?: number;
  /** 关联平台 id */
  platformId?: number;
  /** 是否已处理 */
  resolved: boolean;
}

export interface TierInfo {
  /** color */
  c: string;
  /** price */
  p: number;
}

export type TierName = '尖峰' | '高峰' | '平段' | '低谷' | '深谷';

/** 一周成本节约趋势（演示数据） */
export interface SavingsPoint {
  date: string;
  /** 优化前成本 元 */
  before: number;
  /** 优化后成本 元 */
  after: number;
}
