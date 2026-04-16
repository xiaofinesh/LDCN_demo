import React, { useState } from 'react';
import { C, FONT_MONO, FONT_SANS } from '../constants/tokens';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

void FONT_SANS;


// ── Alert levels ──
type LevelKey = 'red' | 'orange' | 'yellow' | 'blue';
interface AlertData {
  id: string;
  level: LevelKey;
  title: string;
  target: string;
  time: string;
  elapsed: string;
  status: string;
  handler: string;
  desc: string;
  source: string;
  actions: string[];
  timeline?: Array<{ t: string; by: string; act: string; status?: string }>;
  ai?: { summary: string; steps: string[]; confidence?: number; estTime?: string };
  recovery?: string;
}

const LEVELS: Record<LevelKey, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  red: {
    label: '紧急',
    color: '#dc2626',
    bg: '#fee2e2',
    icon: '⚠',
    desc: '即时电话+短信+App推送',
  },
  orange: {
    label: '预警',
    color: '#ea580c',
    bg: '#ffedd5',
    icon: '⚠',
    desc: 'App推送+短信',
  },
  yellow: {
    label: '提醒',
    color: '#ca8a04',
    bg: '#fef3c7',
    icon: '!',
    desc: 'App推送',
  },
  blue: {
    label: '信息',
    color: '#2563eb',
    bg: '#dbeafe',
    icon: 'i',
    desc: 'App内通知',
  },
};

// ── Alert data ──
const ALERTS: AlertData[] = [
  {
    id: 'ALT-2026041614002',
    level: 'red',
    title: '在用电池SOC过低且备用电池未就绪',
    target: 'α-01 / 平台 A-01',
    time: '2026-04-16 13:58:24',
    elapsed: '34 分钟前',
    status: 'processing',
    handler: '张管理员',
    desc: '在用电池 α-01 SOC 降至 12%，预计 42 分钟后需换电；但备用电池 β-02 距离钻井平台约 28 分钟。缓冲时间不足 14 分钟，存在断电风险。',
    source: 'RL 动态调度引擎',
    actions: ['启动应急运输', '通知现场运维', '联系充电站'],
  },
  {
    id: 'ALT-2026041613842',
    level: 'orange',
    title: '预测 2 小时内需换电但备用电池未就位',
    target: 'β-02 / 河间充电站',
    time: '2026-04-16 13:42:10',
    elapsed: '50 分钟前',
    status: 'processing',
    handler: '李调度员',
    desc: 'LSTM 模型预测平台 A-01 将在 15:45 左右需要换电，但 β-02 目前仍在充电（剩余 55 分钟）+ 运输 50 分钟，预计 15:27 才能到位，缓冲时间仅 18 分钟。',
    source: 'MILP 全局优化器',
    actions: ['调整充电优先级', '预约运输卡车'],
  },
  {
    id: 'ALT-2026041614037',
    level: 'orange',
    title: 'γ-03 充电功率异常下降',
    target: 'γ-03 / 河间充电站',
    time: '2026-04-16 14:00:37',
    elapsed: '32 分钟前',
    status: 'processing',
    handler: '-',
    desc: '充电功率从额定 1,725kW 下降至 1,520kW（-12%），可能由充电桩故障或电池BMS限流导致。预计充电时长将延长约 25 分钟。',
    source: 'BMS 实时监控',
    actions: ['联系充电站技术员', '重新规划调度计划'],
  },
  {
    id: 'ALT-2026041613115',
    level: 'yellow',
    title: '卡车运输时间超出预期',
    target: '运输车 T-01 / 河间→任丘',
    time: '2026-04-16 13:11:52',
    elapsed: '1 小时 20 分钟前',
    status: 'resolved',
    handler: '李调度员',
    desc: 'GPS 显示 T-01 在 G18 高速上速度异常（平均 28km/h），预计到达时间延后 18 分钟。已通知司机并调整后续调度。',
    source: 'GPS 追踪',
    actions: [],
  },
  {
    id: 'ALT-2026041612430',
    level: 'yellow',
    title: 'α-01 电池温度偏高',
    target: 'α-01 / 平台 A-01',
    time: '2026-04-16 12:43:01',
    elapsed: '1 小时 49 分钟前',
    status: 'resolved',
    handler: '自动处理',
    desc: '电池温度升至 37.2°C（阈值 35°C），持续 8 分钟后自动降至 33.8°C。环境温度升高所致，无需干预。',
    source: 'BMS 温度传感',
    actions: [],
  },
  {
    id: 'ALT-2026041611220',
    level: 'blue',
    title: '调度计划已更新',
    target: '系统 / 全局调度',
    time: '2026-04-16 11:22:00',
    elapsed: '3 小时 10 分钟前',
    status: 'resolved',
    handler: '系统',
    desc: 'MILP 优化器完成 15分钟滚动优化，下一次换电时间由 15:30 调整为 17:30（向后推迟 2 小时），预计节省充电成本 ¥380。',
    source: 'MILP 全局优化器',
    actions: [],
  },
  {
    id: 'ALT-2026041610805',
    level: 'blue',
    title: '电价时段切换',
    target: '电价系统',
    time: '2026-04-16 10:00:00',
    elapsed: '4 小时 32 分钟前',
    status: 'resolved',
    handler: '系统',
    desc: '进入平段电价时段（¥0.6642/度），持续至 15:00。',
    source: '电价管理',
    actions: [],
  },
];

// ── Components ──

type BadgeSize = 'sm' | 'md' | 'lg';
const LevelBadge: React.FC<{ level: LevelKey; size?: BadgeSize }> = ({ level, size = 'md' }) => {
  const info = LEVELS[level];
  const sizes: Record<BadgeSize, { fontSize: number; padding: string; iconSize: number }> = {
    sm: { fontSize: 11, padding: '2px 8px', iconSize: 10 },
    md: { fontSize: 12, padding: '4px 10px', iconSize: 11 },
    lg: { fontSize: 13, padding: '5px 12px', iconSize: 12 },
  };
  const s = sizes[size];
  return (
    <span style={{
      fontSize: s.fontSize, padding: s.padding, borderRadius: 12,
      background: info.bg, color: info.color, fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: s.iconSize, fontWeight: 900 }}>{info.icon}</span>
      {info.label}
    </span>
  );
};

const StatCard: React.FC<{ level: LevelKey; count: number; trend: number; label: string }> = ({ level, count, trend, label }) => {
  const info = LEVELS[level];
  return (
    <div style={{
      flex: 1, minWidth: 180,
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${info.color}`,
      borderRadius: 10,
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 700 }}>{label}</span>
        <LevelBadge level={level} size="sm" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontSize: 32, fontWeight: 900, color: info.color,
          fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
        }}>{count}</span>
        <span style={{ fontSize: 12, color: C.textMut }}>条活跃</span>
        {trend !== 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, marginLeft: 'auto',
            color: trend > 0 ? C.red : C.accent,
            fontFamily: FONT_MONO,
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
    </div>
  );
};

const AlertRow: React.FC<{ alert: AlertData; selected: boolean; onClick: () => void }> = ({ alert, selected, onClick }) => {
  const info = LEVELS[alert.level];
  const isActive = alert.status === 'processing';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr 160px 130px 110px',
        gap: 16, padding: '14px 20px',
        alignItems: 'center',
        background: selected ? info.bg + '40' : C.bgCard,
        borderBottom: `1px solid ${C.divider}`,
        borderLeft: selected ? `3px solid ${info.color}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
      {/* Level */}
      <div>
        <LevelBadge level={alert.level} size="md" />
      </div>

      {/* Title + target */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{alert.title}</div>
        <div style={{ fontSize: 11, color: C.textSec, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: FONT_MONO }}>🎯 {alert.target}</span>
          <span style={{ color: C.textMut }}>•</span>
          <span>来源：{alert.source}</span>
        </div>
      </div>

      {/* Time */}
      <div>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{alert.elapsed}</div>
        <div style={{ fontSize: 10, color: C.textMut, fontFamily: FONT_MONO, marginTop: 2 }}>{alert.time.slice(11)}</div>
      </div>

      {/* Handler */}
      <div>
        <div style={{ fontSize: 12, color: C.textSec }}>处置人</div>
        <div style={{ fontSize: 12, color: C.text, fontWeight: 600, marginTop: 2 }}>{alert.handler}</div>
      </div>

      {/* Status */}
      <div>
        {isActive ? (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 10,
            background: C.orangeLight, color: C.orange, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: C.orange,
              animation: 'pulse 1.5s infinite',
            }} />
            处置中
          </span>
        ) : (
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 10,
            background: C.accentLight, color: C.accent, fontWeight: 700,
          }}>
            ✓ 已处置
          </span>
        )}
      </div>
    </div>
  );
};

// ── Alert Detail Panel ──
const AlertDetail: React.FC<{ alert: AlertData }> = ({ alert }) => {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = async (label: string, fn: () => Promise<{ message?: string }>) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fn();
      toast.success(r.message ?? `${label} 已执行`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onCall = () => run('呼叫现场', () => api.post(`/api/alerts/${alert.id}/call`));
  const onEmergency = () => run('启动应急预案', () => api.post(`/api/alerts/${alert.id}/emergency`));
  const onAction = (action: string) =>
    run(action, () => api.post(`/api/alerts/${alert.id}/actions/${encodeURIComponent(action)}`));
  const onTransfer = () => run('转派', () => api.post(`/api/alerts/${alert.id}/transfer`, { to: '李调度员' }));
  const onNote = () => run('备注', () => {
    const text = window.prompt('请输入备注内容（演示）') ?? '';
    if (!text) throw new Error('未输入内容，已取消');
    return api.post(`/api/alerts/${alert.id}/note`, { text });
  });
  const onResolve = () => run('标记为已处置', () => api.post(`/api/alerts/${alert.id}/resolve`));

  const info = LEVELS[alert.level];
  const isActive = alert.status === 'processing';

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${C.border}`,
        background: info.bg + '30',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <LevelBadge level={alert.level} size="lg" />
          {isActive && (
            <span style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 12,
              background: C.orange, color: '#fff', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
                animation: 'pulse 1.5s infinite',
              }} />
              处置中
            </span>
          )}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 8px 0', lineHeight: 1.4 }}>
          {alert.title}
        </h2>
        <div style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>
          ID: {alert.id}
        </div>
      </div>

      {/* Emergency action for red */}
      {alert.level === 'red' && (
        <div style={{
          padding: '16px 24px',
          background: C.red,
          color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
              🚨 紧急告警 · 需立即处置
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>
              系统已触发 电话 + 短信 + App推送 通知 · 延迟处置可能导致断电
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: 'rgba(255,255,255,0.2)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 700,
              whiteSpace: 'nowrap',
            }} onClick={onCall}>📞 呼叫现场</span>
            <span style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: '#fff', color: C.red, cursor: 'pointer', fontWeight: 700,
              whiteSpace: 'nowrap',
            }} onClick={onEmergency}>启动应急预案</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px 24px' }}>
        {/* Key info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {[
            ['关联对象', alert.target],
            ['告警时间', alert.time],
            ['告警来源', alert.source],
            ['当前处置人', alert.handler],
          ].map(([k, v]) => (
            <div key={k} style={{
              padding: '10px 14px', background: C.bgSubtle, borderRadius: 6,
            }}>
              <div style={{ fontSize: 11, color: C.textMut, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 600, fontFamily: FONT_MONO }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 10 }}>
            告警详情
          </div>
          <div style={{
            padding: '14px 16px', background: C.bgSubtle, borderRadius: 8,
            fontSize: 13, color: C.textSec, lineHeight: 1.7,
          }}>
            {alert.desc}
          </div>
        </div>

        {/* AI Recommendation */}
        {isActive && alert.actions.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: `1px solid ${C.accent}40`,
            borderRadius: 8, padding: '16px 18px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>AI 推荐处置方案</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alert.actions.map((action: string, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', background: '#fff',
                  borderRadius: 6, border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: C.accentLight, color: C.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{action}</span>
                  <span onClick={() => onAction(action)} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 4,
                    background: C.accent, color: '#fff', cursor: 'pointer', fontWeight: 700,
                  }}>执行</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 12 }}>
            处置时间线
          </div>
          <div style={{ paddingLeft: 6 }}>
            {[
              { time: '13:58:24', desc: '系统自动检测告警', actor: 'RL 引擎', active: false },
              { time: '13:58:30', desc: '已触发电话+短信通知', actor: '告警系统', active: false },
              { time: '13:59:15', desc: '张管理员已确认并开始处置', actor: '张管理员', active: false },
              { time: '14:05:22', desc: '联系现场运维，启动应急运输', actor: '张管理员', active: true },
              { time: '待定', desc: '等待卡车到达运输完成', actor: '-', active: false, pending: true },
            ].map((t, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                {/* Timeline dot & line */}
                <div style={{ position: 'relative', width: 14, flexShrink: 0 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: t.pending ? C.bgCard : t.active ? C.orange : C.accent,
                    border: `2px solid ${t.pending ? C.border : t.active ? C.orange : C.accent}`,
                    marginTop: 4,
                  }} />
                  {i < arr.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 16, left: 5, width: 2, height: 30,
                      background: t.pending ? C.border : C.accent + '60',
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{
                      fontSize: 13, color: t.pending ? C.textMut : C.text, fontWeight: 600,
                    }}>{t.desc}</span>
                    <span style={{
                      fontSize: 11, color: C.textMut, fontFamily: FONT_MONO,
                    }}>{t.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{t.actor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          background: C.bgCardAlt,
        }}>
          <span onClick={onTransfer} style={{
            fontSize: 12, padding: '9px 16px', borderRadius: 7,
            background: C.bgCard, color: C.textSec,
            border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
          }}>转派他人</span>
          <span onClick={onNote} style={{
            fontSize: 12, padding: '9px 16px', borderRadius: 7,
            background: C.bgCard, color: C.textSec,
            border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
          }}>添加备注</span>
          <span onClick={onResolve} style={{
            fontSize: 12, padding: '9px 20px', borderRadius: 7,
            background: C.accent, color: '#fff', cursor: 'pointer', fontWeight: 600,
            boxShadow: `0 2px 6px ${C.accent}40`,
          }}>✓ 标记为已处置</span>
        </div>
      )}
    </div>
  );
};

// ── 24h alert trend chart ──
const AlertTrendChart = () => {
  const data = [
    [0,0,0,1], [0,0,1,0], [0,0,0,1], [0,0,0,0],
    [0,1,0,1], [0,0,1,0], [1,0,0,1], [0,1,0,0],
    [0,0,1,1], [0,0,0,0], [0,1,0,1], [0,0,2,1],
    [1,1,1,1], [0,2,1,0], [1,1,2,0],
  ];
  // each point = [red, orange, yellow, blue]
  const W = 480, H = 90;
  const barW = W / data.length - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      {data.map((bar, i) => {
        let y = H - 10;
        const x = i * (barW + 2) + 2;
        const segments = [
          { count: bar[3], color: C.blue },
          { count: bar[2], color: C.gold },
          { count: bar[1], color: C.orange },
          { count: bar[0], color: C.red },
        ];
        return (
          <g key={i}>
            {segments.map((seg, j) => {
              if (seg.count === 0) return null;
              const h = seg.count * 8;
              y -= h;
              return (
                <rect
                  key={j} x={x} y={y} width={barW} height={h - 1}
                  fill={seg.color} rx="1"
                />
              );
            })}
          </g>
        );
      })}
      {/* Time labels */}
      {[0, 4, 8, 12].map((t, i) => (
        <text
          key={i} x={i * 4 * (barW + 2) + barW/2} y={H - 1}
          fill={C.textMut} fontSize="9" fontFamily={FONT_MONO} textAnchor="middle"
        >{(t*2).toString().padStart(2,'0')}:00</text>
      ))}
    </svg>
  );
};

// ── Main ──
const AlertsPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState('ALT-2026041614002');
  const [filterLevel, setFilterLevel] = useState('all');
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onExportLog = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ filename: string; rows: number }>('/api/alerts/export');
      toast.success(`告警日志已导出（${r.rows} 条）· ${r.filename}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onShowRules = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.get<{ rules: Array<{ id: string; level: string; cond: string; notify: string }> }>('/api/alerts/rules/list');
      toast.info(`已加载 ${r.rules.length} 条告警规则（参见控制台）`);
      console.table(r.rules);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };
  const [filterStatus, setFilterStatus] = useState('all');

  const selected = ALERTS.find(a => a.id === selectedId) || ALERTS[0];

  const filteredAlerts = ALERTS.filter(a => {
    if (filterLevel !== 'all' && a.level !== filterLevel) return false;
    if (filterStatus === 'active' && a.status !== 'processing') return false;
    if (filterStatus === 'resolved' && a.status !== 'resolved') return false;
    return true;
  });

  return (
    <div>
      {/* Top Nav removed */}
      <div style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 900, color: '#fff',
            boxShadow: `0 2px 8px ${C.accent}40`,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3, color: C.text }}>
              电池智能调度平台
            </div>
            <div style={{ fontSize: 10, color: C.textMut, marginTop: 1, letterSpacing: 1 }}>
              LDCN · v1.0
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {['主控台', '电池管理', '充电站', '钻井队', '告警中心', '运营报表', '系统管理'].map((item, i) => (
          <span key={item} style={{
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: i === 4 ? C.accent : C.textSec,
            padding: '8px 14px', borderRadius: 7,
            background: i === 4 ? C.accentLight : 'transparent',
            position: 'relative',
          }}>
            {item}
            {i === 4 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                minWidth: 16, height: 16, borderRadius: 8,
                background: C.red, color: '#fff',
                fontSize: 9, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>3</span>
            )}
          </span>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 8, paddingLeft: 16, borderLeft: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>2026-04-16 14:32</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#fff', fontWeight: 800,
            }}>管</div>
            <div>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>张管理员</div>
              <div style={{ fontSize: 10, color: C.textMut }}>客户管理员</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1480, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
              告警中心
            </h1>
            <p style={{ fontSize: 13, color: C.textSec, margin: '6px 0 0 0' }}>
              四级告警体系 · 红（紧急）/ 橙（预警）/ 黄（提醒）/ 蓝（信息）
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span onClick={onExportLog} style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.bgCard, color: C.textSec,
              border: `1px solid ${C.border}`, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
            }}>导出日志</span>
            <span onClick={onShowRules} style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.bgCard, color: C.textSec,
              border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
            }}>⚙ 告警规则</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
          <StatCard level="red" count={1} trend={1} label="紧急告警" />
          <StatCard level="orange" count={2} trend={0} label="预警" />
          <StatCard level="yellow" count={0} trend={-2} label="提醒" />
          <StatCard level="blue" count={5} trend={0} label="信息" />

          {/* Trend chart */}
          <div style={{
            flex: 1.5, minWidth: 300,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '18px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>24h 告警趋势</span>
              <span style={{ fontSize: 11, color: C.textMut }}>每小时汇总</span>
            </div>
            <AlertTrendChart />
          </div>
        </div>

        {/* Main: Alert list + Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 16 }}>
          {/* Alert list */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            overflow: 'hidden',
          }}>
            {/* Filter bar */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              background: C.bgCardAlt,
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 12, color: C.textSec, fontWeight: 700 }}>级别：</span>
              {[
                ['all', '全部'],
                ['red', '紧急'],
                ['orange', '预警'],
                ['yellow', '提醒'],
                ['blue', '信息'],
              ].map(([k, l]) => (
                <span
                  key={k}
                  onClick={() => setFilterLevel(k)}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 14, cursor: 'pointer',
                    background: filterLevel === k ? C.accent : C.bgCard,
                    color: filterLevel === k ? '#fff' : C.textSec,
                    border: `1px solid ${filterLevel === k ? C.accent : C.border}`,
                    fontWeight: 600,
                  }}>{l}</span>
              ))}
              <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />
              <span style={{ fontSize: 12, color: C.textSec, fontWeight: 700 }}>状态：</span>
              {[['all', '全部'], ['active', '处置中'], ['resolved', '已处置']].map(([k, l]) => (
                <span
                  key={k}
                  onClick={() => setFilterStatus(k)}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 14, cursor: 'pointer',
                    background: filterStatus === k ? C.text : C.bgCard,
                    color: filterStatus === k ? '#fff' : C.textSec,
                    border: `1px solid ${filterStatus === k ? C.text : C.border}`,
                    fontWeight: 600,
                  }}>{l}</span>
              ))}

              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: C.textMut }}>
                共 <span style={{ color: C.text, fontWeight: 700 }}>{filteredAlerts.length}</span> 条
              </span>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 160px 130px 110px',
              gap: 16, padding: '10px 20px',
              background: C.bgSubtle,
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11, color: C.textMut, fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              <span>级别</span>
              <span>告警内容</span>
              <span>发生时间</span>
              <span>处置人</span>
              <span>状态</span>
            </div>

            {/* Alert rows */}
            {filteredAlerts.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                selected={alert.id === selectedId}
                onClick={() => setSelectedId(alert.id)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            overflow: 'hidden',
            position: 'sticky', top: 84,
            maxHeight: 'calc(100vh - 104px)',
            overflowY: 'auto',
          }}>
            <AlertDetail alert={selected} />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default AlertsPage;
