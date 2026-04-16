import { C } from '../constants/colors';

export type ScenarioSeverity = 'high' | 'critical' | 'extreme';

export interface ScenarioStep {
  /** 相对触发时刻的秒数 */
  offset: number;
  /** 标签 */
  label: string;
  /** 详情 */
  detail: string;
  /** 标签色 */
  color: string;
}

export interface Scenario {
  id: string;
  title: string;
  tag: string;
  icon: string;
  severity: ScenarioSeverity;
  /** 触发条件 */
  trigger: string;
  /** 持续时长（秒） */
  duration: number;
  /** 影响范围 */
  impact: string;
  /** 预期结果 */
  outcome: string;
  /** 系统响应步骤（时间线） */
  steps: ScenarioStep[];
  /** KPI：恢复时间 / 断电影响 / 成本影响 */
  metrics: Array<{ k: string; v: string; color: string }>;
  /** 地图热点坐标 (SVG viewBox 760×540) */
  mapX: number;
  mapY: number;
  /** 受影响的电池 id 列表（地图上高亮） */
  affectedBatteries?: number[];
  /** 受影响的平台 id（地图上高亮） */
  affectedPlatform?: number;
  /** 受影响的充电站 id */
  affectedStation?: number;
}

const SEV_COLOR: Record<ScenarioSeverity, string> = {
  high: C.amber,
  critical: C.red,
  extreme: C.purple,
};
export const severityColor = (s: ScenarioSeverity): string => SEV_COLOR[s];
export const severityLabel = (s: ScenarioSeverity): string =>
  s === 'extreme' ? '极端' : s === 'critical' ? '严重' : '高危';

export const SCENARIOS: Scenario[] = [
  {
    id: 'price_spike',
    title: '尖峰电价突袭',
    tag: '市场信号',
    icon: '¥',
    severity: 'high',
    mapX: 145, mapY: 250,
    affectedStation: 1, affectedBatteries: [3],
    trigger: '电网通告：下一小时尖峰电价 ¥1.2709/度（上浮 20%）',
    duration: 60 * 60, // 1h
    impact: '全部在充电池、充电站出线功率',
    outcome: '切换 V2G 模式，平台富余电池反向并网，1 小时内套利收益 ¥3,420',
    steps: [
      { offset: 0, label: 'T+00s', detail: '市场侧 WebSocket 推送尖峰价信号', color: C.amber },
      { offset: 3, label: 'T+03s', detail: 'LSTM 预测确认未来 60 分钟均价上浮 >18%', color: C.blue },
      { offset: 8, label: 'T+08s', detail: 'MILP 重算目标函数：引入 V2G 反送收益项', color: C.accent },
      { offset: 15, label: 'T+15s', detail: '充电中 γ-03 暂停吸收，切换到站内 V2G 并网模式', color: C.purple },
      { offset: 22, label: 'T+22s', detail: '下发平台 B 待命电池 ζ-06 出发至充电站进行并网', color: C.cyan },
      { offset: 3600, label: 'T+60min', detail: '尖峰期结束，恢复常规调度，套利收益 ¥3,420', color: C.accent },
    ],
    metrics: [
      { k: '决策时延', v: '< 15 s', color: C.accent },
      { k: '套利收益', v: '+¥3,420', color: C.accent },
      { k: '供电中断', v: '0 分钟', color: C.accent },
    ],
  },
  {
    id: 'battery_failure',
    title: '电池模组故障',
    tag: '设备异常',
    icon: '⚠',
    severity: 'critical',
    mapX: 520, mapY: 55,
    affectedPlatform: 1, affectedBatteries: [2],
    trigger: 'β-02 电池模组 #07 温度 68℃，BMS 报故障告警',
    duration: 30 * 60, // 30m
    impact: '平台 A 当班供电电池，单电池组熄弧风险',
    outcome: '15 秒内热切换至备用电池 θ-08，平台 A 零断电，β-02 运回维修',
    steps: [
      { offset: 0, label: 'T+00s', detail: 'BMS 上报 #07 模组温度持续 5s > 65℃', color: C.red },
      { offset: 2, label: 'T+02s', detail: 'RL 策略触发紧急换电协议', color: C.purple },
      { offset: 5, label: 'T+05s', detail: '最近可用电池 α-01（平台 A 待命）出发', color: C.amber },
      { offset: 12, label: 'T+12s', detail: 'α-01 抵达 β-02 位置，开始热切换', color: C.accent },
      { offset: 15, label: 'T+15s', detail: '热切换完成，α-01 接管供电，β-02 BMS 自动断路', color: C.accent },
      { offset: 45, label: 'T+45s', detail: 'β-02 装车运回充电站，标记为检修状态', color: C.blue },
      { offset: 1800, label: 'T+30min', detail: '技术团队现场排查 · 单模组故障，其余模组健康', color: C.textSec },
    ],
    metrics: [
      { k: '响应时延', v: '< 5 s', color: C.accent },
      { k: '供电中断', v: '0 秒', color: C.accent },
      { k: '故障隔离', v: '单模组', color: C.amber },
    ],
  },
  {
    id: 'load_surge',
    title: '平台负荷激增',
    tag: '负荷冲击',
    icon: '⚡',
    severity: 'critical',
    mapX: 460, mapY: 145,
    affectedPlatform: 3, affectedBatteries: [7, 8],
    trigger: '平台 C 钻机复合启动，瞬时负荷从 338 kW 激增至 1,150 kW',
    duration: 20 * 60, // 20m
    impact: '平台 C 供电裕度不足，当班电池 SOC 下降速度 3 倍',
    outcome: '调度 2 块待命电池并联供电，保障钻探作业连续性',
    steps: [
      { offset: 0, label: 'T+00s', detail: 'SCADA 检测到平台 C 负荷阶跃 +812 kW', color: C.red },
      { offset: 1, label: 'T+01s', detail: 'η-07 功率输出升至极限 850 kW，SOC 下降率突破阈值', color: C.amber },
      { offset: 4, label: 'T+04s', detail: 'RL 策略决策：并联投入备用电池 θ-08', color: C.purple },
      { offset: 8, label: 'T+08s', detail: 'θ-08 并网合闸，双电池并联供电 1,180 kW', color: C.accent },
      { offset: 420, label: 'T+07min', detail: '钻机全部启动完成，负荷稳定在 1,080 kW', color: C.blue },
      { offset: 1200, label: 'T+20min', detail: 'η-07 SOC 降至 28%，调度 δ-04 进入换电流程', color: C.amber },
    ],
    metrics: [
      { k: '投入时延', v: '< 8 s', color: C.accent },
      { k: '负荷满足率', v: '100%', color: C.accent },
      { k: '裕度扩展', v: '1.5 → 3.5 块', color: C.blue },
    ],
  },
  {
    id: 'station_outage',
    title: '充电站电网故障',
    tag: '上游停电',
    icon: '⊘',
    severity: 'critical',
    mapX: 90, mapY: 315,
    affectedStation: 1, affectedBatteries: [3, 5],
    trigger: '中心充电站 10kV 主进线跳闸，失去电源',
    duration: 90 * 60, // 90m
    impact: '所有在充电池无法继续充电，影响未来 4 小时调度基线',
    outcome: '启用备用充电站 + 延迟非关键充电窗口，MILP 重新规划',
    steps: [
      { offset: 0, label: 'T+00s', detail: '中心站进线失压，站内 UPS 接管监控', color: C.red },
      { offset: 5, label: 'T+05s', detail: '调度中心收到告警，启动应急预案 E-01', color: C.amber },
      { offset: 12, label: 'T+12s', detail: '在充电池 γ-03、ε-05 切换至备用站路径，重新出发', color: C.blue },
      { offset: 180, label: 'T+03min', detail: '备用站（860 kW 容量）接收 γ-03，开始充电', color: C.accent },
      { offset: 1800, label: 'T+30min', detail: 'MILP 重算全天调度，将非关键充电延迟至深夜低谷', color: C.purple },
      { offset: 5400, label: 'T+90min', detail: '中心站恢复供电，调度恢复原基线，成本影响 ¥280', color: C.accent },
    ],
    metrics: [
      { k: '供电影响', v: '0 平台', color: C.accent },
      { k: '当日成本', v: '+¥280', color: C.amber },
      { k: '恢复时间', v: '90 分钟', color: C.blue },
    ],
  },
  {
    id: 'typhoon',
    title: '极端天气 · 台风预警',
    tag: '不可抗力',
    icon: '🌀',
    severity: 'extreme',
    mapX: 380, mapY: 30,
    trigger: '气象局发布沧州地区台风黄色预警，风力 10 级，24h 内登陆',
    duration: 12 * 3600, // 12h
    impact: '运输车辆限行，电池物流中断，充电站并网可能受影响',
    outcome: '进入预备态：全部电池预充至 ≥ 90%，启用双站运行，备冗余 > 48h',
    steps: [
      { offset: 0, label: 'T-12h', detail: '气象 API 推送台风预警，系统自动进入 STORM 模式', color: C.amber },
      { offset: 1800, label: 'T-11.5h', detail: 'MILP 重算：所有电池目标 SOC 上调至 90%', color: C.blue },
      { offset: 14400, label: 'T-8h', detail: '完成全部电池预充，待命比例提升至 75%', color: C.accent },
      { offset: 28800, label: 'T-4h', detail: '备用站独立分区运行，与中心站形成双环网', color: C.purple },
      { offset: 43200, label: 'T+0h', detail: '台风登陆，运输暂停，3 平台依靠就位电池支撑 48h+', color: C.red },
      { offset: 86400, label: 'T+12h', detail: '台风过境，供电全程零中断，平均 SOC 仍 > 55%', color: C.accent },
    ],
    metrics: [
      { k: '预警提前量', v: '12 h', color: C.accent },
      { k: '冗余时长', v: '> 48 h', color: C.accent },
      { k: '供电中断', v: '0 分钟', color: C.accent },
    ],
  },
  {
    id: 'market_crash',
    title: '现货价格闪崩',
    tag: '市场信号',
    icon: '↘',
    severity: 'extreme',
    mapX: 205, mapY: 105,
    affectedStation: 2, affectedBatteries: [2, 6, 8],
    trigger: '现货市场负电价：系统告知 02:00–04:00 实时电价 −¥0.12/度',
    duration: 2 * 3600, // 2h
    impact: '全部调度窗口，充电成本优化目标函数重构',
    outcome: '满功率多站并行充电，产生「负成本」收益 +¥1,860',
    steps: [
      { offset: 0, label: 'T+00s', detail: '市场推送负电价信号 · LSTM 确认持续 120 分钟', color: C.purple },
      { offset: 8, label: 'T+08s', detail: 'MILP 紧急重算：充电优先级最大化', color: C.accent },
      { offset: 20, label: 'T+20s', detail: '下发指令：待命电池 β-02、ζ-06、θ-08 全部启动充电路径', color: C.blue },
      { offset: 600, label: 'T+10min', detail: '双站同时充电，总功率 6,000 kW 满载', color: C.cyan },
      { offset: 7200, label: 'T+120min', detail: '负电价窗口结束，8 块电池全部 100% SOC', color: C.accent },
    ],
    metrics: [
      { k: '充电能量', v: '12,000 kWh', color: C.cyan },
      { k: '负成本收益', v: '+¥1,860', color: C.accent },
      { k: '窗口利用率', v: '100%', color: C.accent },
    ],
  },
  {
    id: 'comm_loss',
    title: '通讯链路中断',
    tag: '网络异常',
    icon: '✕',
    severity: 'high',
    mapX: 560, mapY: 195,
    affectedPlatform: 2, affectedBatteries: [4],
    trigger: '主 4G 基站故障，云端与 β-02 电池失联',
    duration: 15 * 60, // 15m
    impact: '失联电池无法接收调度指令，GPS 位置更新停止',
    outcome: '启用边缘自治模式 + 备用卫星链路，调度指令 15 分钟内恢复',
    steps: [
      { offset: 0, label: 'T+00s', detail: '云端 MQTT 心跳超时，β-02 连接状态变为 UNKNOWN', color: C.amber },
      { offset: 30, label: 'T+30s', detail: '自动重连 4G、5G SA、卫星 3 链路，均失败', color: C.red },
      { offset: 60, label: 'T+60s', detail: '车载边缘控制器激活自治模式，按缓存计划执行', color: C.purple },
      { offset: 180, label: 'T+03min', detail: '切换至北斗短报文备用链路，每 60s 回传 SOC/位置', color: C.blue },
      { offset: 900, label: 'T+15min', detail: '主 4G 基站恢复，全链路校验一致，正式回归云端', color: C.accent },
    ],
    metrics: [
      { k: '自治时长', v: '14 分钟', color: C.purple },
      { k: '调度偏差', v: '< 3%', color: C.accent },
      { k: '最终一致性', v: '已校验', color: C.accent },
    ],
  },
];
