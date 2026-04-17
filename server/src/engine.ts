/**
 * SimulationEngine — 统一调度模拟引擎
 *
 * 驱动 3 块电池按预设 MILP 调度计划运行 24h 循环。
 * 时间尺度：1 real second = 1 sim minute = 1/60 sim hour
 *           → 24 real minutes = 1 sim day
 *
 * 所有 API 端点从此引擎读取状态，前端不做本地计算。
 */

import { state } from './state.js';
import type { Battery, BatteryStatus, Alert } from './state.js';

/* ── 调度计划（来自 MILP 优化结果 · 春季） ── */
interface ScheduleSegment {
  start: number;   // sim hour
  end: number;
  status: BatteryStatus;
  label: string;
}

const SCHEDULE: Record<number, ScheduleSegment[]> = {
  1: [
    { start: 0, end: 6, status: 'supplying', label: '供电' },
    { start: 6, end: 6.25, status: 'swapping', label: '换电' },
    { start: 6.25, end: 7, status: 'to_station', label: '运输→站' },
    { start: 7, end: 10, status: 'charging', label: '充电' },
    { start: 10, end: 10.75, status: 'to_platform', label: '运输→台' },
    { start: 10.75, end: 14.25, status: 'standby', label: '待命' },
    { start: 14.25, end: 14.5, status: 'swapping', label: '换电' },
    { start: 14.5, end: 24, status: 'supplying', label: '供电' },
  ],
  2: [
    { start: 0, end: 2.5, status: 'standby', label: '待命' },
    { start: 2.5, end: 3.25, status: 'to_station', label: '运输→站' },
    { start: 3.25, end: 5.75, status: 'charging', label: '充电' },
    { start: 5.75, end: 6, status: 'to_platform', label: '运输→台' },
    { start: 6, end: 6.25, status: 'swapping', label: '换电' },
    { start: 6.25, end: 14.25, status: 'supplying', label: '供电' },
    { start: 14.25, end: 14.5, status: 'swapping', label: '换电' },
    { start: 14.5, end: 15.25, status: 'to_station', label: '运输→站' },
    { start: 15.25, end: 18.25, status: 'charging', label: '充电' },
    { start: 18.25, end: 19, status: 'to_platform', label: '运输→台' },
    { start: 19, end: 24, status: 'standby', label: '待命' },
  ],
  3: [
    { start: 0, end: 3, status: 'charging', label: '充电' },
    { start: 3, end: 3.75, status: 'to_platform', label: '运输→台' },
    { start: 3.75, end: 24, status: 'standby', label: '待命' },
  ],
};

/* ── 五档分时电价 · 春季 ── */
type TierKey = 'spike' | 'peak' | 'flat' | 'valley' | 'deepValley';
interface TierInfo { label: string; price: number }

const TIERS: Record<TierKey, TierInfo> = {
  spike:      { label: '尖峰', price: 1.0709 },
  peak:       { label: '高峰', price: 0.9380 },
  flat:       { label: '平段', price: 0.6642 },
  valley:     { label: '低谷', price: 0.3904 },
  deepValley: { label: '深谷', price: 0.3669 },
};

const HOUR_TIER: TierKey[] = [
  'flat','flat','flat',
  'valley','valley','valley','valley',
  'flat','flat','flat','flat',
  'valley',
  'deepValley','deepValley','deepValley',
  'flat',
  'peak','peak','peak',
  'spike','spike',
  'peak','peak','peak',
];

/* ── 引擎状态 ── */
export interface EngineSnapshot {
  simTime: string;           // ISO string of simulated time
  simHour: number;           // 0..24
  simDay: number;            // day counter
  tierKey: TierKey;
  tierInfo: TierInfo;
  batteries: Battery[];
  platformLoad: number;      // kW
  cumulativeEnergy: number;  // kWh today
  cumulativeCost: number;    // ¥ today (actual)
  baselineCost: number;      // ¥ today (if no optimization)
  savings: number;           // ¥
  recentAlerts: Alert[];
  schedule: Record<number, ScheduleSegment[]>;
  socHistory: Record<number, Array<{ hour: number; soc: number }>>;
}

/* ── Engine singleton ── */
class SimulationEngine {
  private startReal: number;   // Date.now() at engine start
  private startSimHour: number = 0;
  private socHistory: Record<number, Array<{ hour: number; soc: number }>> = {};
  private lastLoggedHour: number = -1;
  private cumulativeEnergy = 0;
  private cumulativeCost = 0;
  private baselineCost = 0;
  private dayCounter = 1;

  constructor() {
    this.startReal = Date.now();
    // initialize SOC history
    for (const b of state.batteries) {
      this.socHistory[b.id] = [];
    }
  }

  /** Current simulation hour (0..24, wraps) */
  get simHour(): number {
    const elapsedMs = Date.now() - this.startReal;
    const elapsedSimHours = (elapsedMs / 1000) / 60; // 1 real min = 1 sim hour
    return (this.startSimHour + elapsedSimHours) % 24;
  }

  /** Simulation date-time as ISO string */
  get simTime(): Date {
    const base = new Date('2026-04-16T00:00:00');
    const totalHours = this.dayCounter * 24 - 24 + this.simHour;
    return new Date(base.getTime() + totalHours * 3600_000);
  }

  /** Current price tier */
  get tier(): { key: TierKey; info: TierInfo } {
    const h = Math.floor(this.simHour) % 24;
    const key = HOUR_TIER[h];
    return { key, info: TIERS[key] };
  }

  /** Platform load with sinusoidal variation */
  get platformLoad(): number {
    const h = this.simHour;
    return Math.round(535 + Math.sin(h * 1.3) * 120 + Math.sin(h * 3.7) * 60);
  }

  /** Tick — called every 1 real second = 1 sim minute */
  tick(): void {
    const h = this.simHour;

    // Day wrap
    if (h < 0.02 && this.lastLoggedHour > 23) {
      this.dayCounter++;
      this.cumulativeEnergy = 0;
      this.cumulativeCost = 0;
      this.baselineCost = 0;
      for (const b of state.batteries) {
        this.socHistory[b.id] = [];
      }
    }

    // Update each battery based on schedule
    for (const b of state.batteries) {
      const segments = SCHEDULE[b.id];
      if (!segments) continue;
      const seg = segments.find(s => h >= s.start && h < s.end);
      if (!seg) continue;

      b.status = seg.status;

      switch (seg.status) {
        case 'supplying': {
          // Discharge: SOC drops proportional to load / capacity
          // ~10-15%/hour depending on load
          const drawKw = this.platformLoad * 0.95; // single battery supplies ~95% of load
          const kwhPerMin = drawKw / 60;
          const socDrop = (kwhPerMin / b.capacity) * 100;
          b.soc = Math.max(5, b.soc - socDrop);
          b.power = -Math.round(drawKw);
          b.current = Math.round(b.power * 1000 / b.voltage);
          b.location = '钻井平台 A-01';
          break;
        }
        case 'charging': {
          // Charge at rated power
          const chargeKw = 1725;
          const kwhPerMin = chargeKw / 60;
          const socGain = (kwhPerMin / b.capacity) * 100;
          b.soc = Math.min(100, b.soc + socGain);
          b.power = chargeKw;
          b.current = Math.round(chargeKw * 1000 / b.voltage);
          b.location = '充电站-01 河间';

          // Cost tracking
          const tier = this.tier;
          this.cumulativeCost += (kwhPerMin * tier.info.price) / 60;
          this.baselineCost += (kwhPerMin * 0.70) / 60; // baseline ¥0.70/kWh avg
          break;
        }
        case 'to_station': {
          const progress = (h - seg.start) / (seg.end - seg.start);
          b.power = 0;
          b.current = 0;
          b.location = `运输中 → 充电站（${Math.round(progress * 100)}%）`;
          break;
        }
        case 'to_platform': {
          const progress = (h - seg.start) / (seg.end - seg.start);
          b.power = 0;
          b.current = 0;
          b.location = `运输中 → 钻井平台（${Math.round(progress * 100)}%）`;
          break;
        }
        case 'swapping': {
          b.power = 0;
          b.current = 0;
          b.location = '钻井平台 A-01（换电中）';
          break;
        }
        case 'standby': {
          b.power = 0;
          b.current = 0;
          b.location = '钻井平台 A-01';
          break;
        }
      }

      // Temperature simulation
      if (b.status === 'charging') {
        b.temp = Math.min(42, b.temp + (Math.random() - 0.3) * 0.1);
      } else if (b.status === 'supplying') {
        b.temp = Math.min(38, b.temp + (Math.random() - 0.4) * 0.08);
      } else {
        b.temp = Math.max(25, b.temp + (Math.random() - 0.5) * 0.05);
      }
    }

    // Cumulative energy
    this.cumulativeEnergy += this.platformLoad / 60; // kWh per sim minute

    // Log SOC history every sim hour
    const currentHour = Math.floor(h);
    if (currentHour !== this.lastLoggedHour) {
      this.lastLoggedHour = currentHour;
      for (const b of state.batteries) {
        this.socHistory[b.id].push({ hour: currentHour, soc: Math.round(b.soc) });
      }
      // Generate alerts at key SOC thresholds
      this.checkAlerts();
    }
  }

  /** Check and generate alerts */
  private checkAlerts(): void {
    for (const b of state.batteries) {
      if (b.status === 'supplying' && b.soc <= 20 && b.soc > 15) {
        this.addAlert('orange', `${b.name} SOC 降至 ${Math.round(b.soc)}%`,
          `预计 ${Math.round(b.soc / 14)}h 后需换电，请确认备用电池就位`,
          b.name);
      }
      if (b.status === 'supplying' && b.soc <= 12) {
        this.addAlert('red', `${b.name} SOC 极低 ${Math.round(b.soc)}%`,
          `断电风险 · 请立即启动换电流程`,
          b.name);
      }
    }
  }

  private addAlert(level: 'red' | 'orange' | 'yellow' | 'blue', title: string, desc: string, target: string): void {
    // Deduplicate: don't add if same title in last 5 alerts
    const recent = state.alerts.slice(-5);
    if (recent.some(a => a.title === title)) return;

    const id = `ALT-${Date.now()}`;
    state.alerts.push({
      id,
      level,
      title,
      target,
      time: this.simTime.toISOString().replace('T', ' ').slice(0, 19),
      elapsed: '刚刚',
      status: 'processing',
      handler: '系统自动',
      desc,
      source: level === 'red' ? 'RL 动态调度引擎' : 'MILP 全局优化器',
      actions: level === 'red' ? ['启动应急换电', '通知现场运维'] : ['调整充电优先级'],
      notes: [],
    });
  }

  /** Get full snapshot for API */
  snapshot(): EngineSnapshot {
    const tier = this.tier;
    return {
      simTime: this.simTime.toISOString(),
      simHour: Math.round(this.simHour * 100) / 100,
      simDay: this.dayCounter,
      tierKey: tier.key,
      tierInfo: tier.info,
      batteries: state.batteries.map(b => ({ ...b, soc: Math.round(b.soc * 10) / 10 })),
      platformLoad: this.platformLoad,
      cumulativeEnergy: Math.round(this.cumulativeEnergy),
      cumulativeCost: Math.round(this.cumulativeCost),
      baselineCost: Math.round(this.baselineCost),
      savings: Math.round(this.baselineCost - this.cumulativeCost),
      recentAlerts: state.alerts.slice(-10).reverse(),
      schedule: SCHEDULE,
      socHistory: { ...this.socHistory },
    };
  }
}

/* ── Singleton ── */
let engine: SimulationEngine | null = null;

export function getEngine(): SimulationEngine {
  if (!engine) engine = new SimulationEngine();
  return engine;
}

export function startEngine(): void {
  const eng = getEngine();
  setInterval(() => eng.tick(), 1000); // 1 real second = 1 sim minute
  eng.tick(); // initial tick
  console.log('[engine] simulation started · 1 real min = 1 sim hour · 24 min = 1 day');
}

export { SCHEDULE, TIERS, HOUR_TIER };
export type { TierKey, TierInfo, ScheduleSegment };
