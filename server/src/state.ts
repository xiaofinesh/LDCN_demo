/**
 * 内存数据状态。模拟 BMS / GPS / 调度引擎数据。
 * 单进程内有效，重启即重置。
 */

export type BatteryStatus = 'supplying' | 'standby' | 'charging' | 'to_station' | 'to_platform' | 'swapping';
export type AlertLevel = 'red' | 'orange' | 'yellow' | 'blue';
export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'executing' | 'completed';

export interface Battery {
  id: number;
  name: string;
  serial: string;
  soc: number;
  soh: number;
  status: BatteryStatus;
  location: string;
  power: number;            // kW，正=充电，负=放电
  voltage: number;
  current: number;
  temp: number;
  capacity: number;
  cycles: number;
  installedAt: string;
  lastSwap: string;
  monthlySaving: number;    // 元
}

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  target: string;
  time: string;
  elapsed: string;
  status: 'processing' | 'resolved' | 'transferred';
  handler: string;
  desc: string;
  source: string;
  actions: string[];
  notes: string[];
  resolvedAt?: string;
  transferredTo?: string;
  callLog?: string[];
  emergencyTriggered?: boolean;
}

export interface DrillingPlan {
  id: string;
  team: string;
  wellName: string;
  startDate: string;
  endDate: string;
  rigType: string;
  expectedDailyKwh: number;
  status: PlanStatus;
  createdAt: string;
  submittedAt?: string;
  notes?: string;
}

export interface ScheduleEvent {
  id: string;
  batteryId: number;
  type: 'supply' | 'charge' | 'transport' | 'swap' | 'standby';
  start: string;            // ISO
  end: string;
  source: 'milp' | 'rl' | 'manual';
  triggeredBy?: string;
}

export interface ExportJob {
  id: string;
  type: 'dashboard' | 'battery' | 'alert' | 'pricing-pdf';
  status: 'queued' | 'rendering' | 'ready';
  url?: string;
  createdAt: string;
}

export interface MapLayerPref {
  layer: 'satellite' | 'road' | 'label';
}

/* ── seed data ── */
export const state = {
  batteries: [
    {
      id: 1, name: 'α-01', serial: 'BAT-A01-2025-0042',
      soc: 62, soh: 96, status: 'supplying' as BatteryStatus,
      location: '钻井平台 A-01',
      power: -680, voltage: 768.4, current: -885, temp: 32.5,
      capacity: 5000, cycles: 287,
      installedAt: '2025-08-12', lastSwap: '2026-04-16 06:15',
      monthlySaving: 18420,
    },
    {
      id: 2, name: 'β-02', serial: 'BAT-B02-2025-0043',
      soc: 100, soh: 97, status: 'standby' as BatteryStatus,
      location: '钻井平台 A-01',
      power: 0, voltage: 802.1, current: 0, temp: 28.1,
      capacity: 5000, cycles: 264,
      installedAt: '2025-08-15', lastSwap: '2026-04-16 06:00',
      monthlySaving: 16780,
    },
    {
      id: 3, name: 'γ-03', serial: 'BAT-C03-2025-0044',
      soc: 47, soh: 95, status: 'charging' as BatteryStatus,
      location: '充电站-01 河间',
      power: 1725, voltage: 765.2, current: 2255, temp: 35.8,
      capacity: 5000, cycles: 312,
      installedAt: '2025-08-20', lastSwap: '2026-04-16 03:25',
      monthlySaving: 17550,
    },
  ] as Battery[],

  alerts: [
    {
      id: 'ALT-2026041614002',
      level: 'red', title: '在用电池SOC过低且备用电池未就绪',
      target: 'α-01 / 平台 A-01',
      time: '2026-04-16 13:58:24', elapsed: '34 分钟前',
      status: 'processing', handler: '张管理员',
      desc: '在用电池 α-01 SOC 降至 12%，预计 42 分钟后需换电；但备用电池 β-02 距离钻井平台约 28 分钟。缓冲时间不足 14 分钟，存在断电风险。',
      source: 'RL 动态调度引擎',
      actions: ['启动应急运输', '通知现场运维', '联系充电站'],
      notes: [],
    },
    {
      id: 'ALT-2026041613842',
      level: 'orange', title: '预测 2 小时内需换电但备用电池未就位',
      target: 'β-02 / 河间充电站',
      time: '2026-04-16 13:42:10', elapsed: '50 分钟前',
      status: 'processing', handler: '李调度员',
      desc: 'LSTM 模型预测平台 A-01 将在 15:45 左右需要换电，但 β-02 目前仍在充电（剩余 55 分钟）+ 运输 50 分钟，预计 15:27 才能到位，缓冲时间仅 18 分钟。',
      source: 'MILP 全局优化器',
      actions: ['调整充电优先级', '预约运输卡车'],
      notes: [],
    },
    {
      id: 'ALT-2026041614037',
      level: 'orange', title: 'γ-03 充电功率异常下降',
      target: 'γ-03 / 河间充电站',
      time: '2026-04-16 14:00:37', elapsed: '32 分钟前',
      status: 'processing', handler: '-',
      desc: '充电功率从额定 1,725kW 下降至 1,520kW（-12%），可能由充电桩故障或电池BMS限流导致。预计充电时长将延长约 25 分钟。',
      source: 'BMS 实时监控',
      actions: ['联系充电站技术员', '重新规划调度计划'],
      notes: [],
    },
  ] as Alert[],

  drillingPlans: [] as DrillingPlan[],
  scheduleEvents: [] as ScheduleEvent[],
  exportJobs: [] as ExportJob[],
  mapLayer: { layer: 'road' } as MapLayerPref,

  /* counters */
  _planSeq: 1000,
  _alertSeq: 5000,
  _exportSeq: 100,
  _eventSeq: 10000,
};

export function nextPlanId(): string {
  state._planSeq += 1;
  return `DRL-2026-${state._planSeq}`;
}
export function nextAlertId(): string {
  state._alertSeq += 1;
  return `ALT-2026${state._alertSeq}`;
}
export function nextExportId(): string {
  state._exportSeq += 1;
  return `EXP-${state._exportSeq}`;
}
export function nextEventId(): string {
  state._eventSeq += 1;
  return `EVT-${state._eventSeq}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
