import React, { useEffect, useState } from 'react';
import { C, FONT_MONO, FONT_SANS } from '../constants/tokens';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

void FONT_SANS;


// ── Price tiers ──
const TIERS = [
  { k: 'peak',       label: '尖峰', price: 1.0709, color: C.red,    bg: C.redLight },
  { k: 'high',       label: '高峰', price: 0.9380, color: C.orange, bg: C.orangeLight },
  { k: 'flat',       label: '平段', price: 0.6642, color: C.blue,   bg: C.blueLight },
  { k: 'valley',     label: '低谷', price: 0.3904, color: C.cyan,   bg: C.cyanLight },
  { k: 'deepValley', label: '深谷', price: 0.3669, color: C.accent, bg: C.accentLight },
];

// ── Monthly data (April 2026, 16 days so far) ──
const MONTH_DATA = {
  totalCharge: 180850,          // kWh
  actualCost: 78360,             // ¥
  baselineCost: 101200,          // ¥
  savings: 22840,                // ¥
  savingsPct: 22.6,              // %
  avgPriceActual: 0.4333,        // ¥/kWh
  avgPriceBaseline: 0.5597,      // ¥/kWh
  theoreticalMax: 58950,         // ¥ (max possible savings if 100% deep valley)
};

// ── Tier distribution (actual vs baseline) ──
const TIER_DIST = [
  // [tier, actualPct, baselinePct]
  { k: 'peak',       actual: 2,  baseline: 18 },
  { k: 'high',       actual: 6,  baseline: 22 },
  { k: 'flat',       actual: 28, baseline: 35 },
  { k: 'valley',     actual: 36, baseline: 18 },
  { k: 'deepValley', actual: 28, baseline: 7  },
];

// ── Daily savings history (last 16 days) ──
const DAILY_SAVINGS = [
  { d: 1,  saved: 1420, pct: 22.8 },
  { d: 2,  saved: 1680, pct: 25.1 },
  { d: 3,  saved: 980,  pct: 18.4 },
  { d: 4,  saved: 1520, pct: 23.2 },
  { d: 5,  saved: 1320, pct: 21.5 },
  { d: 6,  saved: 1820, pct: 26.3 },
  { d: 7,  saved: 1450, pct: 22.1 },
  { d: 8,  saved: 1590, pct: 24.0 },
  { d: 9,  saved: 780,  pct: 14.5 },
  { d: 10, saved: 1680, pct: 25.3 },
  { d: 11, saved: 1410, pct: 21.8 },
  { d: 12, saved: 1530, pct: 22.9 },
  { d: 13, saved: 1240, pct: 19.5 },
  { d: 14, saved: 1620, pct: 24.6 },
  { d: 15, saved: 1400, pct: 21.8 },
  { d: 16, saved: 1400, pct: 22.0 },
];

// ── Components ──

type StatSize = 'lg' | 'md' | 'sm';
interface StatProps { label: string; value: string | number; unit: string; sub?: string; color?: string; size?: StatSize }
const Stat: React.FC<StatProps> = ({ label, value, unit, sub, color = C.text, size = 'md' }) => {
  const sizes: Record<StatSize, { num: number; unit: number; label: number }> = {
    lg: { num: 36, unit: 14, label: 13 },
    md: { num: 26, unit: 12, label: 12 },
    sm: { num: 20, unit: 11, label: 11 },
  };
  const s = sizes[size];
  return (
    <div>
      <div style={{ fontSize: s.label, color: C.textSec, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: s.num, fontWeight: 900, color,
          fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
        }}>{value}</span>
        <span style={{ fontSize: s.unit, color: C.textMut, fontWeight: 500 }}>{unit}</span>
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 5, lineHeight: 1.4 }}>{sub}</div>
      )}
    </div>
  );
};

// ── Tier distribution bar ──
const TierBar: React.FC<{ data: 'actual' | 'baseline'; label: string }> = ({ data, label }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: C.textMut, fontFamily: FONT_MONO }}>100%</span>
    </div>
    <div style={{
      display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden',
      border: `1px solid ${C.border}`,
    }}>
      {TIER_DIST.map(item => {
        const pct = item[data];
        const tier = TIERS.find(t => t.k === item.k);
        return (
          <div key={item.k} style={{
            width: `${pct}%`,
            background: tier?.color ?? C.textMut,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
            borderRight: `1px solid rgba(255,255,255,0.3)`,
            transition: 'all 0.3s',
          }}>
            {pct >= 8 ? `${pct}%` : ''}
          </div>
        );
      })}
    </div>
  </div>
);

// ── Daily savings chart ──
const DailySavingsChart: React.FC = () => {
  const W = 820, H = 220;
  const padL = 46, padR = 20, padT = 20, padB = 36;
  const maxSaved = Math.max(...DAILY_SAVINGS.map(d => d.saved));
  void Math.max(...DAILY_SAVINGS.map(d => d.pct));
  const barW = (W - padL - padR) / DAILY_SAVINGS.length - 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Y-axis grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = padT + (H - padT - padB) * (1 - p);
        const val = Math.round(maxSaved * p);
        return (
          <g key={p}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={C.divider} strokeWidth="1" />
            <text x={padL - 6} y={y + 3} fill={C.textMut} fontSize="10"
              textAnchor="end" fontFamily={FONT_MONO}>
              ¥{val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {DAILY_SAVINGS.map((d, i) => {
        const x = padL + i * ((W - padL - padR) / DAILY_SAVINGS.length) + 2;
        const h = (d.saved / maxSaved) * (H - padT - padB);
        const y = H - padB - h;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={h}
              fill="url(#barGrad)"
              rx="2"
            />
            {/* Value label on top of bar */}
            {i % 3 === 0 && (
              <text x={x + barW/2} y={y - 4} fontSize="9"
                fill={C.textSec} textAnchor="middle" fontWeight="600">
                {(d.saved/1000).toFixed(1)}k
              </text>
            )}
          </g>
        );
      })}

      {/* Line for % */}
      <polyline
        points={DAILY_SAVINGS.map((d, i) => {
          const x = padL + i * ((W - padL - padR) / DAILY_SAVINGS.length) + 2 + barW/2;
          const y = padT + (H - padT - padB) * (1 - d.pct / 30);
          return `${x},${y}`;
        }).join(' ')}
        stroke={C.orange}
        strokeWidth="2"
        fill="none"
      />
      {DAILY_SAVINGS.map((d, i) => {
        const x = padL + i * ((W - padL - padR) / DAILY_SAVINGS.length) + 2 + barW/2;
        const y = padT + (H - padT - padB) * (1 - d.pct / 30);
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={C.orange} stroke="#fff" strokeWidth="1.5" />
        );
      })}

      {/* X-axis labels */}
      {DAILY_SAVINGS.map((d, i) => {
        if (i % 2 !== 0) return null;
        const x = padL + i * ((W - padL - padR) / DAILY_SAVINGS.length) + 2 + barW/2;
        return (
          <text key={i} x={x} y={H - padB + 16} fontSize="10"
            fill={C.textMut} textAnchor="middle" fontFamily={FONT_MONO}>
            4/{d.d}
          </text>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${W - padR - 200}, ${padT + 4})`}>
        <rect x="0" y="0" width="12" height="10" fill={C.accent} rx="2" />
        <text x="18" y="9" fontSize="10" fill={C.textSec} fontWeight="600">日节省金额</text>
        <line x1="98" y1="5" x2="112" y2="5" stroke={C.orange} strokeWidth="2" />
        <circle cx="105" cy="5" r="2.5" fill={C.orange} />
        <text x="118" y="9" fontSize="10" fill={C.textSec} fontWeight="600">节省比例 %</text>
      </g>

      {/* Right axis for % */}
      {[0, 10, 20, 30].map(p => {
        const y = padT + (H - padT - padB) * (1 - p / 30);
        return (
          <text key={p} x={W - padR + 4} y={y + 3} fill={C.orange} fontSize="10"
            fontFamily={FONT_MONO} fontWeight="600">
            {p}%
          </text>
        );
      })}
    </svg>
  );
};

// ── Cost comparison chart (actual vs baseline) ──
const CostComparisonChart = () => {
  const W = 480, H = 160;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      {/* Two vertical bars side by side */}
      <g transform="translate(60, 15)">
        {/* Baseline bar */}
        <g>
          <rect x="30" y="0" width="80" height="110" fill={C.bgSubtle} stroke={C.border} strokeWidth="1" rx="4" />
          <text x="70" y="55" fontSize="22" fill={C.textSec} fontFamily={FONT_MONO}
            textAnchor="middle" fontWeight="900">¥{(MONTH_DATA.baselineCost/1000).toFixed(1)}k</text>
          <text x="70" y="73" fontSize="10" fill={C.textMut} textAnchor="middle">无优化基准</text>
          <text x="70" y="130" fontSize="11" fill={C.textSec} textAnchor="middle" fontWeight="700">
            人工调度
          </text>
          <text x="70" y="144" fontSize="9" fill={C.textMut} textAnchor="middle">(估算)</text>
        </g>

        {/* Arrow + savings label */}
        <g transform="translate(135, 55)">
          <path d="M 0 0 L 50 0" stroke={C.accent} strokeWidth="2" markerEnd="url(#arrowhead)" />
          <rect x="10" y="-30" width="70" height="22" rx="11" fill={C.accent} />
          <text x="45" y="-15" fontSize="11" fill="#fff" textAnchor="middle" fontWeight="800">
            -{MONTH_DATA.savingsPct}%
          </text>
        </g>

        {/* Actual bar */}
        <g>
          <rect x="245" y="25" width="80" height="85"
            fill={C.accent}
            rx="4" />
          <text x="285" y="70" fontSize="22" fill="#fff" fontFamily={FONT_MONO}
            textAnchor="middle" fontWeight="900">¥{(MONTH_DATA.actualCost/1000).toFixed(1)}k</text>
          <text x="285" y="88" fontSize="10" fill="rgba(255,255,255,0.9)" textAnchor="middle">AI 优化后</text>
          <text x="285" y="130" fontSize="11" fill={C.text} textAnchor="middle" fontWeight="700">
            本月实际
          </text>
          <text x="285" y="144" fontSize="9" fill={C.textMut} textAnchor="middle">(16天)</text>
        </g>
      </g>

      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={C.accent} />
        </marker>
      </defs>
    </svg>
  );
};

// ── Main ──
const PricingReportPage: React.FC = () => {
  const [activeTimeTab, setActiveTimeTab] = useState('month');
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  // 切换时间区间时刷新汇总（仅触发后端，前端展示沿用 mockup 数据）
  useEffect(() => {
    api.get(`/api/reports/savings?range=${activeTimeTab}`).catch(() => {});
  }, [activeTimeTab]);

  const onExportPdf = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ filename: string; message: string }>('/api/reports/pdf');
      toast.success(`${r.message}（${r.filename}）`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onAdvancedFilter = () => {
    toast.info('高级筛选弹窗（演示占位）');
  };

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
            color: i === 5 ? C.accent : C.textSec,
            padding: '8px 14px', borderRadius: 7,
            background: i === 5 ? C.accentLight : 'transparent',
          }}>{item}</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMut, marginBottom: 8 }}>
              <span style={{ cursor: 'pointer' }}>运营报表</span>
              <span>›</span>
              <span style={{ color: C.text, fontWeight: 600 }}>电价优化分析</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
              电价优化分析报表
            </h1>
            <p style={{ fontSize: 13, color: C.textSec, margin: '6px 0 0 0' }}>
              量化展示 AI 调度带来的充电成本节省 · 基于实际充电数据与河北电网分时电价
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Time range selector */}
            <div style={{
              display: 'flex', background: C.bgCard, borderRadius: 7,
              border: `1px solid ${C.border}`, padding: 3,
            }}>
              {[['day', '日'], ['week', '周'], ['month', '月'], ['year', '年']].map(([k, l]) => (
                <span
                  key={k}
                  onClick={() => setActiveTimeTab(k)}
                  style={{
                    fontSize: 12, padding: '6px 14px', borderRadius: 5, cursor: 'pointer',
                    background: activeTimeTab === k ? C.accent : 'transparent',
                    color: activeTimeTab === k ? '#fff' : C.textSec,
                    fontWeight: 700,
                  }}>{l}</span>
              ))}
            </div>
            <span onClick={onAdvancedFilter} style={{
              fontSize: 12, padding: '9px 16px', borderRadius: 7,
              background: C.bgCard, color: C.textSec,
              border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
            }}>📅 2026年4月</span>
            <span onClick={onExportPdf} style={{
              fontSize: 12, padding: '9px 18px', borderRadius: 7,
              background: C.accent, color: '#fff', cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
              boxShadow: `0 2px 6px ${C.accent}40`,
            }}>📄 导出 PDF</span>
          </div>
        </div>

        {/* Hero KPI Row */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #dcfce7 100%)',
          border: `1px solid ${C.accent}30`,
          borderRadius: 14, padding: '24px 28px', marginBottom: 20,
          boxShadow: '0 2px 8px rgba(13,155,108,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 200, height: 200,
            borderRadius: '50%', background: `${C.accent}08`,
          }} />

          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>
            ● 2026 年 4 月累计（1-16 日）
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
            gap: 32, alignItems: 'center', position: 'relative',
          }}>
            {/* Main number */}
            <div>
              <div style={{ fontSize: 13, color: C.textSec, fontWeight: 700, marginBottom: 8 }}>
                AI 调度累计节省
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 20, color: C.accent, fontWeight: 700 }}>¥</span>
                <span style={{
                  fontSize: 56, fontWeight: 900, color: C.accent,
                  fontFamily: FONT_MONO, letterSpacing: -3, lineHeight: 1,
                }}>{MONTH_DATA.savings.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 8 }}>
                预计全年节省 <span style={{ color: C.accent, fontWeight: 800, fontFamily: FONT_MONO }}>¥ 51.4 万</span>
                {' · '}
                按 300 天运营计算
              </div>
            </div>

            {/* Savings % */}
            <div style={{ textAlign: 'center', borderLeft: `1px dashed ${C.accent}40`, paddingLeft: 28 }}>
              <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 6 }}>节省比例</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                <span style={{
                  fontSize: 40, fontWeight: 900, color: C.text,
                  fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
                }}>{MONTH_DATA.savingsPct}</span>
                <span style={{ fontSize: 20, color: C.textSec, fontWeight: 700 }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginTop: 6 }}>
                ↑ 超出保守预期 15-20%
              </div>
            </div>

            {/* Actual avg price */}
            <div style={{ textAlign: 'center', borderLeft: `1px dashed ${C.accent}40`, paddingLeft: 28 }}>
              <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 6 }}>实际加权电价</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                <span style={{ fontSize: 14, color: C.textSec, fontWeight: 700 }}>¥</span>
                <span style={{
                  fontSize: 36, fontWeight: 900, color: C.text,
                  fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
                }}>{MONTH_DATA.avgPriceActual.toFixed(3)}</span>
              </div>
              <div style={{ fontSize: 11, color: C.textMut, marginTop: 6, textDecoration: 'line-through' }}>
                基准 ¥{MONTH_DATA.avgPriceBaseline.toFixed(3)} /度
              </div>
            </div>

            {/* Total charge */}
            <div style={{ textAlign: 'center', borderLeft: `1px dashed ${C.accent}40`, paddingLeft: 28 }}>
              <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 6 }}>累计充电量</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, justifyContent: 'center' }}>
                <span style={{
                  fontSize: 36, fontWeight: 900, color: C.text,
                  fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
                }}>{(MONTH_DATA.totalCharge/1000).toFixed(1)}</span>
                <span style={{ fontSize: 14, color: C.textSec, fontWeight: 700 }}>MWh</span>
              </div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 6 }}>
                日均 11,303 kWh
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Cost comparison + Tier distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Cost comparison card */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ marginBottom: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                成本对比
              </h3>
              <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                AI 优化后 vs 无优化基准（假设各电价时段随机分布）
              </p>
            </div>
            <CostComparisonChart />

            {/* Detail breakdown */}
            <div style={{
              marginTop: 8, padding: '14px 16px',
              background: C.bgSubtle, borderRadius: 8,
            }}>
              <div style={{ fontSize: 11, color: C.textSec, fontWeight: 700, marginBottom: 10 }}>节省金额拆解</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '避开尖峰时段节省', value: 8720, color: C.red },
                  { label: '避开高峰时段节省', value: 9140, color: C.orange },
                  { label: '深谷/低谷时段多充节省', value: 4980, color: C.accent },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: 2, background: item.color,
                      }} />
                      <span style={{ fontSize: 12, color: C.textSec }}>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: 13, color: C.text, fontFamily: FONT_MONO, fontWeight: 800,
                    }}>¥ {item.value.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 8, borderTop: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 800 }}>合计节省</span>
                  <span style={{
                    fontSize: 15, color: C.accent, fontFamily: FONT_MONO, fontWeight: 900,
                  }}>¥ {MONTH_DATA.savings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tier distribution card */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                充电时段分布
              </h3>
              <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                AI 将充电集中在低电价时段 · 深谷+低谷占比 <span style={{ color: C.accent, fontWeight: 700 }}>64%</span>
              </p>
            </div>

            <TierBar data="actual" label="AI 优化后（实际）" />
            <TierBar data="baseline" label="无优化基准（估算）" />

            {/* Tier legend with prices */}
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {TIERS.map(tier => (
                <div key={tier.k} style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: tier.bg,
                  border: `1px solid ${tier.color}30`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: tier.color, fontWeight: 800, marginBottom: 3 }}>
                    {tier.label}
                  </div>
                  <div style={{
                    fontSize: 12, color: C.text, fontFamily: FONT_MONO, fontWeight: 800,
                  }}>
                    ¥{tier.price.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>

            {/* Key insight */}
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: C.accentLight, borderRadius: 6,
              borderLeft: `3px solid ${C.accent}`,
              fontSize: 12, color: C.text, lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700 }}>关键洞察：</span>
              深谷充电占比从 7% 提升至 28%，尖峰充电从 18% 降至 2%
            </div>
          </div>
        </div>

        {/* Row 2: Daily savings trend */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: '22px 24px', marginBottom: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                每日节省金额趋势
              </h3>
              <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                2026年4月每日AI优化节省金额 + 节省比例
              </p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <Stat label="日均节省" value="1,428" unit="元" size="sm" color={C.accent} />
              <Stat label="最高单日" value="1,820" unit="元" size="sm" color={C.text} />
              <Stat label="最低单日" value="780" unit="元" size="sm" color={C.textSec} />
              <Stat label="标准差" value="± 235" unit="元" size="sm" color={C.textSec} />
            </div>
          </div>
          <DailySavingsChart />
        </div>

        {/* Row 3: ROI projection + Theoretical analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          {/* ROI projection */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px 0' }}>
              年化收益预测
            </h3>

            {/* Scenario table */}
            <div style={{
              border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '110px 100px 100px 110px 1fr',
                gap: 12, padding: '12px 16px',
                background: C.bgSubtle,
                borderBottom: `1px solid ${C.border}`,
                fontSize: 11, color: C.textSec, fontWeight: 700, letterSpacing: 0.3,
              }}>
                <span>场景</span>
                <span style={{ textAlign: 'right' }}>优化比例</span>
                <span style={{ textAlign: 'right' }}>日节省</span>
                <span style={{ textAlign: 'right' }}>年节省</span>
                <span>说明</span>
              </div>

              {[
                { label: '保守', pct: '15%', daily: '1,187', yearly: '35.6 万', desc: '初期保守预估', color: C.textSec, bg: 'transparent' },
                { label: '中性', pct: '20%', daily: '1,582', yearly: '47.5 万', desc: '稳定运行期预期', color: C.blue, bg: C.blueLight+'40' },
                { label: '实际（当前）', pct: '22.6%', daily: '1,428', yearly: '51.4 万', desc: '基于4月前16天数据', color: C.accent, bg: C.accentLight+'60', highlight: true },
                { label: '乐观', pct: '25%', daily: '1,978', yearly: '59.3 万', desc: '算法持续优化后', color: C.textSec, bg: 'transparent' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '110px 100px 100px 110px 1fr',
                  gap: 12, padding: '14px 16px',
                  background: row.bg,
                  borderBottom: i < 3 ? `1px solid ${C.divider}` : 'none',
                  alignItems: 'center',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 13, color: row.color, fontWeight: row.highlight ? 900 : 700,
                    }}>{row.label}</span>
                    {row.highlight && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 8,
                        background: C.accent, color: '#fff', fontWeight: 700,
                      }}>当前</span>
                    )}
                  </span>
                  <span style={{
                    fontSize: 14, color: row.color, fontFamily: FONT_MONO, fontWeight: 800,
                    textAlign: 'right',
                  }}>{row.pct}</span>
                  <span style={{
                    fontSize: 13, color: C.text, fontFamily: FONT_MONO, fontWeight: 700,
                    textAlign: 'right',
                  }}>¥ {row.daily}</span>
                  <span style={{
                    fontSize: 15, color: row.color, fontFamily: FONT_MONO, fontWeight: 900,
                    textAlign: 'right',
                  }}>¥ {row.yearly}</span>
                  <span style={{ fontSize: 11, color: C.textSec }}>{row.desc}</span>
                </div>
              ))}
            </div>

            {/* Note */}
            <div style={{
              marginTop: 12, fontSize: 11, color: C.textMut, lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700 }}>测算说明：</span>
              按单平台 300 天运营计算 · 扩展至多平台后，节省金额按平台数量线性增长
              · 随着AI模型持续优化，预计全年实际节省将趋近乐观区间
            </div>
          </div>

          {/* Theoretical analysis */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: `1px solid ${C.gold}40`,
            borderRadius: 12, padding: '22px 24px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 16px 0' }}>
              优化空间分析
            </h3>

            {/* Progress to theoretical max */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>已实现 / 理论最大</span>
                <span style={{ fontSize: 12, color: C.gold, fontFamily: FONT_MONO, fontWeight: 800 }}>
                  38.7%
                </span>
              </div>
              <div style={{
                height: 10, background: '#fff', borderRadius: 5, overflow: 'hidden',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: '38.7%', height: '100%',
                  background: `linear-gradient(90deg, ${C.accent}, ${C.gold})`,
                  borderRadius: 5,
                }} />
              </div>
            </div>

            {/* Theoretical max */}
            <div style={{
              padding: '12px 14px', background: '#fff',
              borderRadius: 8, marginBottom: 12,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 11, color: C.textMut, marginBottom: 4 }}>理论最大年节省</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 12, color: C.textSec, fontWeight: 700 }}>¥</span>
                <span style={{
                  fontSize: 28, color: C.gold, fontFamily: FONT_MONO, fontWeight: 900,
                  letterSpacing: -1,
                }}>239</span>
                <span style={{ fontSize: 13, color: C.textSec, fontWeight: 700 }}>万</span>
              </div>
              <div style={{ fontSize: 10, color: C.textMut, marginTop: 4 }}>
                100% 深谷充电 vs 100% 尖峰充电
              </div>
            </div>

            {/* Key limiters */}
            <div style={{ fontSize: 11, color: C.text, fontWeight: 700, marginBottom: 8 }}>
              制约因素分析
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['电池轮转周期', '3块电池约束，时间灵活度有限'],
                ['深谷时段仅 3-4h', '无法全部充电安排在此时段'],
                ['高峰日应急需求', '偶尔需在非最优时段紧急充电'],
                ['算法精度提升空间', '随数据积累可逐步优化'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  padding: '8px 10px', background: '#fff',
                  borderRadius: 5, fontSize: 11,
                  border: `1px solid ${C.border}`,
                }}>
                  <span style={{ color: C.text, fontWeight: 700 }}>{k}</span>
                  <span style={{ color: C.textSec }}> — {v}</span>
                </div>
              ))}
            </div>

            {/* Call to action */}
            <div style={{
              marginTop: 14, padding: '10px 12px',
              background: C.gold, color: '#fff', borderRadius: 6,
              fontSize: 11, lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 800 }}>💡 建议：</span>
              增加第4块备用电池可进一步提升调度灵活性，预计再节省 5-8%
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingReportPage;
