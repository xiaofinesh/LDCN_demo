import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_MONO } from '../constants/tokens';
import { api } from '../api/client';
import { useToast } from '../components/Toast';


// ── Current battery data ──
const BATTERY = {
  id: 1, name: 'α-01',
  serial: 'BAT-A01-2025-0042',
  model: 'CATL EnerC 5MWh',
  capacity: 5000, // kWh
  manufactured: '2025-08-15',
  installed: '2025-09-20',
  soc: 62,
  status: 'supplying',
  location: '钻井平台 A-01 · 任丘市于村乡',
  voltage: 1024.5,
  current: -664,
  power: -680,
  temp: 32.5,
  cycleCount: 187,
  health: 98.4,
  monthSavings: 14820, // ¥
  estRemainingHours: 3.5,
};

const STATUS_MAP = {
  supplying: { label: '供电中', color: '#0d9b6c', bg: '#d1f4e3' },
  standby: { label: '待命', color: '#2563eb', bg: '#dbeafe' },
  charging: { label: '充电中', color: '#0891b2', bg: '#cffafe' },
};

// ── 24h SOC history data ──
const SOC_HISTORY = [
  100,100,100,100,100,100,                  // 0-5: standby
  100, 88, 72, 56, 40, 24,                  // 6-11: discharging
  10, 10, 10,                                // 12-14: swap + transport
  18, 38, 60, 82, 98,                        // 15-19: charging
  100, 100, 100, 92,                         // 20-23: standby + start discharge
  62                                          // current
];

// ── Charge/discharge log ──
const CHARGE_LOG = [
  { time: '2026-04-16 06:15', type: '换电', detail: '换出 SOC 8% · 接管供电', status: '完成' },
  { time: '2026-04-16 07:00', type: '充电开始', detail: '河间充电站 · 平段电价 ¥0.6642/度', status: '完成' },
  { time: '2026-04-16 10:00', type: '充电完成', detail: '充入 4,650 kWh · 用时 3h00m · 成本 ¥3,089', status: '完成' },
  { time: '2026-04-16 10:45', type: '运输到达', detail: '抵达平台 A-01 · 进入待命', status: '完成' },
  { time: '2026-04-16 14:30', type: '换电', detail: '接管供电 · 当前供电中', status: '进行中' },
];

// ── Working status timeline (24h) ──
const STATUS_TIMELINE = [
  { start: 0, end: 6, status: 'supplying', label: '供电' },
  { start: 6, end: 6.25, status: 'swapping', label: '换' },
  { start: 6.25, end: 7, status: 'transport', label: '运输' },
  { start: 7, end: 10, status: 'charging', label: '充电' },
  { start: 10, end: 10.75, status: 'transport', label: '运输' },
  { start: 10.75, end: 14.5, status: 'standby', label: '待命' },
  { start: 14.5, end: 24, status: 'supplying', label: '供电（预测）' },
];

const STATUS_COLOR: Record<string, string> = {
  supplying: '#0d9b6c',
  standby: '#2563eb',
  charging: '#0891b2',
  swapping: '#7c3aed',
  transport: '#ea580c',
};

// ── Battery shape component (horizontal dry-cell style) ──
const BatteryShape: React.FC<{ soc: number; charging?: boolean }> = ({ soc, charging = false }) => {
  // Color based on SOC level
  const fillColor = soc > 60 ? C.accent : soc > 25 ? C.orange : C.red;
  const fillBg = soc > 60 ? C.accentLight : soc > 25 ? C.orangeLight : C.redLight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      {/* Battery Container */}
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Main battery body */}
        <div style={{
          width: 280, height: 130,
          border: `4px solid ${C.text}`,
          borderRadius: 14,
          padding: 6,
          background: C.bgCard,
          position: 'relative',
          boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
        }}>
          {/* Inner fill area */}
          <div style={{
            width: '100%', height: '100%',
            background: fillBg,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Fill bar */}
            <div style={{
              width: `${soc}%`, height: '100%',
              background: `linear-gradient(135deg, ${fillColor}, ${fillColor}dd)`,
              transition: 'width 0.6s ease',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Cell divider lines (like real battery) */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.15) 28px 30px)`,
              }} />
              {/* Animated charging effect */}
              {charging && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                  animation: 'shimmer 2s infinite',
                }} />
              )}
            </div>

            {/* Big SOC number overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4,
            }}>
              <span style={{
                fontSize: 56, fontWeight: 900, color: C.text,
                fontFamily: FONT_MONO, lineHeight: 1,
                textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                letterSpacing: -2,
              }}>{soc}</span>
              <span style={{
                fontSize: 22, fontWeight: 700, color: C.text,
                opacity: 0.6, marginTop: 18,
              }}>%</span>
            </div>
          </div>
        </div>

        {/* Positive terminal (right cap) */}
        <div style={{
          width: 12, height: 50,
          background: C.text,
          borderRadius: '0 4px 4px 0',
          marginLeft: -1,
        }} />
      </div>

      {/* SOC label */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>当前电量</span>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 12,
          background: fillColor + '15', color: fillColor, fontWeight: 700,
        }}>
          {soc > 60 ? '充足' : soc > 25 ? '偏低' : '极低'}
        </span>
      </div>

      {/* Capacity indicator */}
      <div style={{
        marginTop: 12, fontSize: 12, color: C.textMut,
        display: 'flex', gap: 20,
      }}>
        <span>容量 <span style={{ color: C.text, fontFamily: FONT_MONO, fontWeight: 700 }}>{(BATTERY.capacity * BATTERY.soc / 100).toLocaleString()}</span> / {BATTERY.capacity.toLocaleString()} kWh</span>
      </div>
    </div>
  );
};

// ── Real-time data card ──
interface DataMetricProps { label: string; value: string | number; unit?: string; color?: string; big?: boolean; }
const DataMetric: React.FC<DataMetricProps> = ({ label, value, unit, color = C.text, big = false }) => (
  <div style={{
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '14px 16px',
  }}>
    <div style={{ fontSize: 12, color: C.textSec, marginBottom: 6, fontWeight: 600 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontSize: big ? 22 : 18, fontWeight: 800, color,
        fontFamily: FONT_MONO, letterSpacing: -0.5, lineHeight: 1,
      }}>{value}</span>
      <span style={{ fontSize: 11, color: C.textMut, fontWeight: 500 }}>{unit}</span>
    </div>
  </div>
);

// ── SOC History Chart ──
const SOCChart = () => {
  const W = 700, H = 140;
  const data = SOC_HISTORY;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / 100) * (H - 20) - 10,
  }));
  const path = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');
  const areaPath = path + ` L ${W} ${H} L 0 ${H} Z`;

  // Current time indicator (24th index = current hour)
  const currentX = (24 / (data.length - 1)) * W;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line
            x1="0" x2={W}
            y1={H - (v / 100) * (H - 20) - 10}
            y2={H - (v / 100) * (H - 20) - 10}
            stroke={C.divider} strokeWidth="1"
          />
          <text
            x="2" y={H - (v / 100) * (H - 20) - 13}
            fill={C.textMut} fontSize="9" fontFamily={FONT_MONO}
          >{v}</text>
        </g>
      ))}

      {/* Hour markers */}
      {[0, 6, 12, 18, 24].map(h => (
        <text
          key={h} x={(h / 24) * W} y={H - 1}
          fill={C.textMut} fontSize="9" fontFamily={FONT_MONO} textAnchor="middle"
        >{h}:00</text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#socGradient)" />

      {/* Line */}
      <path d={path} stroke={C.accent} strokeWidth="2.5" fill="none" />

      {/* Forecast portion (after current) */}
      <line
        x1={currentX} x2={currentX} y1="10" y2={H - 15}
        stroke={C.text} strokeWidth="1.5" strokeDasharray="4 3"
      />
      <text x={currentX + 4} y="22" fill={C.text} fontSize="10" fontWeight="700">现在</text>

      {/* Current point */}
      <circle cx={currentX} cy={H - (62 / 100) * (H - 20) - 10} r="5" fill={C.accent} stroke="#fff" strokeWidth="2" />
    </svg>
  );
};

// ── Working status timeline ──
const StatusTimeline = () => {
  return (
    <div>
      <div style={{ position: 'relative', height: 32, background: C.bgSubtle, borderRadius: 6, overflow: 'hidden' }}>
        {STATUS_TIMELINE.map((s, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(s.start / 24) * 100}%`,
            width: `${((s.end - s.start) / 24) * 100}%`,
            top: 0, bottom: 0,
            background: STATUS_COLOR[s.status],
            opacity: s.label.includes('预测') ? 0.5 : 0.85,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 700,
            borderRight: `1px solid ${C.bgCard}`,
          }}>
            {((s.end - s.start) / 24 * 100) > 8 && s.label}
          </div>
        ))}

        {/* Current time line */}
        <div style={{
          position: 'absolute',
          left: `${(14.5 / 24) * 100}%`,
          top: -2, bottom: -2,
          borderLeft: `2px solid ${C.text}`,
          zIndex: 10,
        }}>
          <div style={{
            position: 'absolute', top: -10, left: -14,
            fontSize: 9, color: '#fff', background: C.text,
            padding: '2px 6px', borderRadius: 3, fontWeight: 800,
          }}>NOW</div>
        </div>
      </div>

      {/* Time axis */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {[0, 4, 8, 12, 16, 20, 24].map(h => (
          <span key={h} style={{ fontSize: 10, color: C.textMut, fontFamily: FONT_MONO }}>
            {h.toString().padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Tab Content Components ──

const TabBasicInfo = () => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
      {[
        ['电池编号', BATTERY.serial],
        ['型号', BATTERY.model],
        ['额定容量', `${BATTERY.capacity.toLocaleString()} kWh`],
        ['出厂日期', BATTERY.manufactured],
        ['投入使用', BATTERY.installed],
        ['累计循环', `${BATTERY.cycleCount} 次`],
      ].map(([k, v]) => (
        <div key={k} style={{
          padding: '10px 14px', background: C.bgSubtle, borderRadius: 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: C.textSec }}>{k}</span>
          <span style={{ fontSize: 13, color: C.text, fontWeight: 700, fontFamily: FONT_MONO }}>{v}</span>
        </div>
      ))}
    </div>

    {/* Health score */}
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      border: `1px solid ${C.accent}40`,
      borderRadius: 10, padding: '16px 18px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 700 }}>电池健康度 (SOH)</span>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 10,
          background: C.accent, color: '#fff', fontWeight: 700,
        }}>优良</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 900, color: C.accent, fontFamily: FONT_MONO, letterSpacing: -1 }}>
          {BATTERY.health}
        </span>
        <span style={{ fontSize: 14, color: C.textMut, fontWeight: 600 }}>%</span>
      </div>
      <div style={{ marginTop: 10, height: 6, background: '#fff', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${BATTERY.health}%`, height: '100%', background: C.accent, borderRadius: 3 }} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.textSec }}>
        基于循环次数、温度异常、容量衰减综合评估 · 预计剩余寿命约 8.2 年
      </div>
    </div>

    {/* Economic contribution */}
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: `1px solid ${C.gold}40`,
      borderRadius: 10, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 700 }}>本月经济贡献</span>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 10,
          background: C.goldLight, color: C.gold, fontWeight: 700,
        }}>4月累计</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 11, color: C.textSec }}>¥</span>
        <span style={{ fontSize: 32, fontWeight: 900, color: C.gold, fontFamily: FONT_MONO, letterSpacing: -1 }}>
          {BATTERY.monthSavings.toLocaleString()}
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: C.textSec }}>
        通过 AI 调度选择低价时段充电 · 较人工调度节省充电成本 22.4%
      </div>
    </div>
  </div>
);

const TabAISuggestion = () => (
  <div>
    {/* Current task */}
    <div style={{
      background: C.bgCard, border: `1px solid ${C.accent}`,
      borderLeft: `4px solid ${C.accent}`,
      borderRadius: 8, padding: '14px 18px', marginBottom: 14,
    }}>
      <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 6 }}>当前任务</div>
      <div style={{ fontSize: 14, color: C.text, fontWeight: 700, marginBottom: 4 }}>
        正在为钻井平台 A-01 供电
      </div>
      <div style={{ fontSize: 12, color: C.textSec }}>
        预计可持续供电至 <span style={{ color: C.text, fontWeight: 700, fontFamily: FONT_MONO }}>17:30</span>
        （剩余 {BATTERY.estRemainingHours} 小时）
      </div>
    </div>

    {/* Next planned action */}
    <div style={{
      background: '#f0f9ff', border: `1px solid ${C.blue}40`,
      borderRadius: 8, padding: '14px 18px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 10,
          background: C.blue, color: '#fff', fontWeight: 700,
        }}>下一步</span>
        <span style={{ fontSize: 12, color: C.textMut, fontFamily: FONT_MONO }}>预计 17:30</span>
      </div>
      <div style={{ fontSize: 14, color: C.text, fontWeight: 700, marginBottom: 6 }}>
        换电 → 由 β-02 接管供电，本电池运输至河间充电站充电
      </div>
      <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
        充电时段：18:00-21:00（高峰段）→ 系统已优化 → 调整为 22:00-01:00（低谷段）
        <br />
        <span style={{ color: C.accent, fontWeight: 700 }}>预计节省充电成本 ¥1,032</span>
      </div>
    </div>

    {/* AI dispatch reasoning */}
    <div style={{
      background: C.bgSubtle, borderRadius: 8, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 10 }}>
        🤖 调度决策依据
      </div>
      {[
        { k: '负荷预测', v: 'LSTM 模型预测今晚 17-22 点平均功率 720 kW' },
        { k: '电价分析', v: '深谷时段 22:00-01:00 比高峰时段便宜 64%' },
        { k: '电池状态', v: '当前 SOC 62%，可继续供电 3.5h，无需提前换电' },
        { k: '运输窗口', v: '到河间充电站约 50 分钟，符合时间约束' },
      ].map(item => (
        <div key={item.k} style={{
          display: 'flex', gap: 12, padding: '6px 0',
          borderBottom: `1px dashed ${C.border}`,
        }}>
          <span style={{
            fontSize: 11, color: C.textMut, fontWeight: 700,
            minWidth: 70, flexShrink: 0,
          }}>{item.k}</span>
          <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{item.v}</span>
        </div>
      ))}
    </div>
  </div>
);

const TabHistory: React.FC<{ range: string; onRange: (r: string) => void }> = ({ range, onRange }) => (
  <div>
    <div style={{
      position: 'relative', width: '100%', height: 320,
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      background: '#e8eef4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
    }}>
      {/* Simplified map placeholder showing trajectory */}
      <svg viewBox="0 0 700 320" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="grid" patternUnits="userSpaceOnUse" width="40" height="40">
            <rect width="40" height="40" fill="#f4f1e8" />
            <path d="M 0 20 L 40 20" stroke="#e8e3d0" strokeWidth="0.5" />
            <path d="M 20 0 L 20 40" stroke="#e8e3d0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="700" height="320" fill="url(#grid)" />

        {/* Roads */}
        <path d="M 80 250 Q 250 200 400 130 Q 500 80 620 60" stroke="#fbbf24" strokeWidth="6" fill="none" />
        <path d="M 80 250 Q 250 200 400 130 Q 500 80 620 60" stroke="#fff" strokeWidth="0.6" fill="none" strokeDasharray="6 6" />

        {/* Trajectory points (one full day) */}
        <g>
          {/* Position points throughout the day */}
          {[
            { x: 620, y: 60, time: '00:00 平台供电' },
            { x: 620, y: 60, time: '06:00 换电完成' },
            { x: 500, y: 90, time: '06:30 运输中' },
            { x: 350, y: 165, time: '06:50 运输中' },
            { x: 80, y: 250, time: '07:00 抵达充电站' },
            { x: 80, y: 250, time: '10:00 充电完成' },
            { x: 250, y: 200, time: '10:25 返程' },
            { x: 620, y: 60, time: '10:45 抵达平台' },
          ].map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4"
              fill={i === 7 ? C.accent : i < 5 ? C.orange : C.blue}
              stroke="#fff" strokeWidth="1.5" />
          ))}
        </g>

        {/* Charging station */}
        <g transform="translate(80, 250)">
          <circle r="14" fill="#fff" stroke={C.cyan} strokeWidth="2.5" />
          <text y="5" fontSize="14" textAnchor="middle" fill={C.cyan} fontWeight="900">⚡</text>
        </g>
        <text x="80" y="280" fontSize="11" textAnchor="middle" fill={C.text} fontWeight="700">河间充电站</text>

        {/* Platform */}
        <g transform="translate(620, 60)">
          <circle r="14" fill="#fff" stroke={C.accent} strokeWidth="2.5" />
          <text y="5" fontSize="14" textAnchor="middle" fill={C.accent} fontWeight="900">◎</text>
        </g>
        <text x="620" y="38" fontSize="11" textAnchor="middle" fill={C.text} fontWeight="700">平台 A-01</text>

        {/* Date label */}
        <text x="14" y="22" fontSize="12" fill={C.text} fontWeight="700">2026-04-16 全天轨迹</text>
        <text x="14" y="38" fontSize="10" fill={C.textSec}>共记录 1,248 个GPS点 · 累计行驶 91.2 km</text>
      </svg>
    </div>

    {/* Trip stats */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
      {[
        ['今日行驶', '91.2', 'km'],
        ['运输趟次', '2', '次'],
        ['平均速度', '52', 'km/h'],
        ['今日满电', '1', '次'],
      ].map(([k, v, u]) => (
        <div key={k} style={{
          background: C.bgSubtle, borderRadius: 6, padding: '10px 12px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>{k}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>{v}</span>
            <span style={{ fontSize: 10, color: C.textMut }}>{u}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Date selector */}
    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: C.textSec }}>选择日期：</span>
      {['今日', '昨日', '近7天', '近30天', '自定义'].map((t) => {
        const active = range === t;
        return (
          <span
            key={t}
            onClick={() => onRange(t)}
            style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: active ? C.accent : C.bgCard,
              color: active ? '#fff' : C.textSec,
              border: `1px solid ${active ? C.accent : C.border}`,
              fontWeight: 600,
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  </div>
);

const TabChargeLog = () => (
  <div>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: C.bgSubtle }}>
          {['时间', '类型', '详情', '状态'].map(h => (
            <th key={h} style={{
              padding: '10px 14px', textAlign: 'left', fontSize: 12,
              color: C.textSec, fontWeight: 700, borderBottom: `1px solid ${C.border}`,
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CHARGE_LOG.map((log, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${C.divider}` }}>
            <td style={{ padding: '12px 14px', fontSize: 11, color: C.textSec, fontFamily: FONT_MONO }}>
              {log.time}
            </td>
            <td style={{ padding: '12px 14px' }}>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 700,
                background: log.type === '充电完成' ? C.accentLight : log.type === '换电' ? C.purpleLight : C.bgSubtle,
                color: log.type === '充电完成' ? C.accent : log.type === '换电' ? C.purple : C.textSec,
              }}>{log.type}</span>
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: C.text }}>
              {log.detail}
            </td>
            <td style={{ padding: '12px 14px' }}>
              <span style={{
                fontSize: 11, color: log.status === '完成' ? C.accent : C.orange,
                fontWeight: 700,
              }}>● {log.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ marginTop: 16, padding: '14px 18px', background: C.bgSubtle, borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8, fontWeight: 700 }}>本月汇总</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          ['充电次数', '24'],
          ['累计充电量', '92,400 kWh'],
          ['累计成本', '¥51,028'],
          ['深谷充电占比', '42.3%'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: C.textMut }}>{k}</div>
            <div style={{ fontSize: 16, color: C.text, fontFamily: FONT_MONO, fontWeight: 800, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Battery Detail Page ──
const BatteryDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [historyRange, setHistoryRange] = useState('今日');
  const st = STATUS_MAP[BATTERY.status as keyof typeof STATUS_MAP];
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ filename: string; message: string }>(`/api/batteries/${BATTERY.id}/export`);
      toast.success(`${r.message} · ${r.filename}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onSwap = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ message: string; eta: string }>(`/api/batteries/${BATTERY.id}/swap`);
      toast.success(`${r.message}（预计 ${r.eta}）`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onManualSchedule = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ message: string; eventId: string }>('/api/scheduling/manual', {
        batteryId: BATTERY.id, reason: '电池详情页手动触发',
      });
      toast.success(`${r.message}（${r.eventId}）`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const tabs = [
    { id: 'basic', label: '基本信息' },
    { id: 'ai', label: 'AI 调度建议' },
    { id: 'history', label: '历史轨迹' },
    { id: 'log', label: '充放电记录' },
  ];

  return (
    <div>
{/* Content */}
      <div style={{ padding: '20px 28px', maxWidth: 1480, margin: '0 auto' }}>
        {/* Page header with breadcrumb */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMut, marginBottom: 8 }}>
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>电池管理</span>
            <span>›</span>
            <span style={{ color: C.textSec }}>电池列表</span>
            <span>›</span>
            <span style={{ color: C.text, fontWeight: 600 }}>{BATTERY.name} 详情</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span onClick={() => navigate(-1)} style={{
                width: 36, height: 36, borderRadius: 8,
                background: C.bgCard, border: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: C.textSec, cursor: 'pointer',
              }}>←</span>
              <h1 style={{
                fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3,
                fontFamily: FONT_MONO,
              }}>{BATTERY.name}</h1>
              <span style={{
                fontSize: 13, padding: '5px 12px', borderRadius: 14,
                background: st.bg, color: st.color, fontWeight: 700,
              }}>● {st.label}</span>
              <span style={{ fontSize: 13, color: C.textSec }}>{BATTERY.location}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onExport} disabled={busy} style={{
                fontSize: 12, padding: '8px 16px', borderRadius: 7,
                background: C.bgCard, color: C.textSec,
                border: `1px solid ${C.border}`, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                fontFamily: 'inherit',
              }}>导出数据</button>
              <button onClick={onSwap} disabled={busy} style={{
                fontSize: 12, padding: '8px 16px', borderRadius: 7,
                background: C.purple, color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                boxShadow: `0 2px 6px ${C.purple}40`,
                border: 'none', fontFamily: 'inherit',
              }}>⚡ 立即换电</button>
              <button onClick={onManualSchedule} disabled={busy} style={{
                fontSize: 12, padding: '8px 16px', borderRadius: 7,
                background: C.accent, color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                boxShadow: `0 2px 6px ${C.accent}40`,
                border: 'none', fontFamily: 'inherit',
              }}>+ 手动调度</button>
            </div>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, marginBottom: 16 }}>
          {/* Left column: Battery shape + real-time data */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 4px 0' }}>
              电量状态
            </h3>
            <p style={{ fontSize: 12, color: C.textSec, margin: 0 }}>实时SOC监测</p>

            {/* Battery shape */}
            <BatteryShape soc={BATTERY.soc} charging={false} />

            {/* Real-time metrics grid */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 700, marginBottom: 10 }}>实时数据</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <DataMetric label="电压" value={BATTERY.voltage.toFixed(1)} unit="V" big />
                <DataMetric label="电流" value={BATTERY.current} unit="A" color={BATTERY.current < 0 ? C.accent : C.cyan} big />
                <DataMetric label="实时功率" value={`${BATTERY.power > 0 ? '+' : ''}${BATTERY.power}`} unit="kW"
                  color={BATTERY.power < 0 ? C.accent : C.cyan} big />
                <DataMetric label="温度" value={BATTERY.temp} unit="°C"
                  color={BATTERY.temp > 35 ? C.orange : C.text} big />
              </div>
            </div>

            {/* Quick stats */}
            <div style={{
              marginTop: 14, padding: '12px 14px',
              background: C.bgSubtle, borderRadius: 8,
              display: 'flex', justifyContent: 'space-around',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>累计循环</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>
                  {BATTERY.cycleCount}
                </div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>健康度</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, fontFamily: FONT_MONO }}>
                  {BATTERY.health}%
                </div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>剩余时长</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>
                  {BATTERY.estRemainingHours}h
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Tabs */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Tab nav */}
            <div style={{
              display: 'flex', borderBottom: `1px solid ${C.border}`,
              padding: '0 8px',
            }}>
              {tabs.map(tab => (
                <span key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '14px 20px', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                    color: activeTab === tab.id ? C.accent : C.textSec,
                    borderBottom: activeTab === tab.id ? `3px solid ${C.accent}` : '3px solid transparent',
                    marginBottom: -1,
                  }}>
                  {tab.label}
                </span>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '20px 24px', flex: 1 }}>
              {activeTab === 'basic' && <TabBasicInfo />}
              {activeTab === 'ai' && <TabAISuggestion />}
              {activeTab === 'history' && (
                <TabHistory
                  range={historyRange}
                  onRange={(r) => {
                    setHistoryRange(r);
                    toast.info(`切换历史范围：${r}`);
                  }}
                />
              )}
              {activeTab === 'log' && <TabChargeLog />}
            </div>
          </div>
        </div>

        {/* Bottom: SOC chart + Status timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* SOC History */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                  SOC 24h 变化
                </h3>
                <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                  实线为实际数据，"现在"线后为预测
                </p>
              </div>
              <span style={{
                fontSize: 11, color: C.accent, fontFamily: FONT_MONO, fontWeight: 700,
                padding: '4px 10px', borderRadius: 4, background: C.accentLight,
              }}>● 正常</span>
            </div>
            <SOCChart />
          </div>

          {/* Status Timeline */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                  工作状态时间线
                </h3>
                <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                  全天工作状态分布
                </p>
              </div>
            </div>

            <StatusTimeline />

            {/* Status legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
              {[
                ['supplying', '供电'],
                ['standby', '待命'],
                ['charging', '充电'],
                ['transport', '运输'],
                ['swapping', '换电'],
              ].map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: STATUS_COLOR[k],
                  }} />
                  <span style={{ fontSize: 11, color: C.textSec, fontWeight: 600 }}>{l}</span>
                </div>
              ))}
            </div>

            {/* Today's summary */}
            <div style={{
              marginTop: 18, padding: '12px 14px',
              background: C.bgSubtle, borderRadius: 8,
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            }}>
              {[
                ['供电时长', '13.5h'],
                ['充电时长', '3h'],
                ['运输时长', '1.5h'],
                ['待命时长', '6h'],
              ].map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: C.textSec, marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default BatteryDetailPage;
