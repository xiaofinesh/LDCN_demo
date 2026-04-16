import { useState } from "react";

// ── Light theme design tokens ──
const C = {
  bg: '#f5f7fa',
  bgCard: '#ffffff',
  bgCardAlt: '#fafbfc',
  bgSubtle: '#f0f4f8',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  divider: '#edf2f7',

  accent: '#0d9b6c',       // Brand green - signals power/operational
  accentLight: '#d1f4e3',
  blue: '#2563eb',
  blueLight: '#dbeafe',
  cyan: '#0891b2',
  cyanLight: '#cffafe',
  purple: '#7c3aed',
  orange: '#ea580c',
  orangeLight: '#ffedd5',
  red: '#dc2626',
  redLight: '#fee2e2',
  gold: '#ca8a04',

  text: '#0f172a',
  textSec: '#475569',
  textMut: '#94a3b8',
  textInverse: '#ffffff',
};

const FONT_MONO = "'SF Mono','Roboto Mono','JetBrains Mono','Courier New',monospace";
const FONT_SANS = "'PingFang SC','Microsoft YaHei','-apple-system','Segoe UI',sans-serif";

// ── Battery data ──
const BATTERIES = [
  { id: 1, name: 'α-01', soc: 62, status: 'supplying', location: '钻井平台 A-01', power: -680, temp: 32.5 },
  { id: 2, name: 'β-02', soc: 100, status: 'standby', location: '钻井平台 A-01', power: 0, temp: 28.1 },
  { id: 3, name: 'γ-03', soc: 47, status: 'charging', location: '充电站-01 河间', power: 1725, temp: 35.8 },
];

const STATUS_MAP = {
  supplying: { label: '供电中', color: C.accent, bg: C.accentLight, icon: '⚡' },
  standby: { label: '待命', color: C.blue, bg: C.blueLight, icon: '◉' },
  charging: { label: '充电中', color: C.cyan, bg: C.cyanLight, icon: '↑' },
  to_station: { label: '运输中', color: C.orange, bg: C.orangeLight, icon: '→' },
};

// ── Price tiers ──
const HOURS_TIER = [
  'flat','flat','flat','valley','valley','valley','valley',
  'flat','flat','flat','flat','valley','deepValley','deepValley',
  'deepValley','flat','peak','peak','peak','peak','peak',
  'peak','peak','peak'
];
const TIER_INFO = {
  peak: { label: '高峰', color: '#ea580c', price: 0.938 },
  flat: { label: '平段', color: '#2563eb', price: 0.664 },
  valley: { label: '低谷', color: '#0891b2', price: 0.390 },
  deepValley: { label: '深谷', color: '#0d9b6c', price: 0.367 },
};

const CURRENT_HOUR = 14;

// ── Activity feed ──
const ALERTS = [
  { level: 'info', time: '14:15', msg: 'α-01 SOC 62% · 预计可持续供电至 17:30' },
  { level: 'warn', time: '14:00', msg: 'γ-03 充电功率下降至 1,520 kW · 较额定值低 12%' },
  { level: 'ok', time: '13:45', msg: '调度计划已更新 · 下次换电 17:30 · β-02 → α-01' },
  { level: 'info', time: '12:30', msg: '钻井平台 A-01 负荷波动 720 kW · RL 引擎评估无需调整' },
];

// ── Components ──

const KPICard = ({ label, value, unit, sub, color, icon, trend }) => (
  <div style={{
    flex: 1, minWidth: 180,
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '20px 22px',
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: `${color}15`, color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }}>{icon}</div>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>{label}</span>
      </div>
      {trend && (
        <span style={{
          fontSize: 11, color: trend > 0 ? C.accent : C.red,
          fontFamily: FONT_MONO, fontWeight: 600,
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{
        fontSize: 32, fontWeight: 800, color: C.text,
        fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
      }}>{value}</span>
      <span style={{ fontSize: 14, color: C.textMut, fontWeight: 500 }}>{unit}</span>
    </div>
    <div style={{ fontSize: 12, color: C.textSec, marginTop: 8, lineHeight: 1.4 }}>{sub}</div>
  </div>
);

const BatteryCard = ({ b }) => {
  const st = STATUS_MAP[b.status];
  const r = 30, stroke = 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - b.soc / 100);
  const socColor = b.soc > 60 ? C.accent : b.soc > 25 ? C.orange : C.red;

  return (
    <div style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex', gap: 16, alignItems: 'center',
      boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
    }}>
      {/* SOC ring */}
      <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
        <svg viewBox="0 0 72 72" style={{ width: 72, height: 72 }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke={C.divider} strokeWidth={stroke} />
          <circle cx="36" cy="36" r={r} fill="none" stroke={socColor} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 36 36)"
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: socColor, fontFamily: FONT_MONO, lineHeight: 1 }}>{b.soc}</span>
          <span style={{ fontSize: 9, color: C.textMut, marginTop: 2 }}>SOC %</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.text, fontFamily: FONT_MONO }}>{b.name}</span>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: st.bg, color: st.color, fontWeight: 700,
          }}>
            {st.icon} {st.label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>{b.location}</div>
        <div style={{ display: 'flex', gap: 18 }}>
          <div>
            <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>实时功率</div>
            <span style={{
              fontSize: 13, color: b.power < 0 ? C.accent : b.power > 0 ? C.cyan : C.textSec,
              fontFamily: FONT_MONO, fontWeight: 700,
            }}>
              {b.power > 0 ? '+' : ''}{b.power} <span style={{ fontSize: 10, color: C.textMut }}>kW</span>
            </span>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>温度</div>
            <span style={{
              fontSize: 13, color: b.temp > 35 ? C.orange : C.text,
              fontFamily: FONT_MONO, fontWeight: 700,
            }}>
              {b.temp} <span style={{ fontSize: 10, color: C.textMut }}>°C</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceTimeline = () => (
  <div>
    <div style={{ display: 'flex', gap: 1, height: 40, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
      {HOURS_TIER.map((tier, i) => {
        const info = TIER_INFO[tier];
        const isCurrent = i === CURRENT_HOUR;
        return (
          <div key={i} style={{
            flex: 1, background: isCurrent ? info.color : `${info.color}25`,
            position: 'relative',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: 3,
          }}>
            {isCurrent && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                fontSize: 9, color: '#fff', background: info.color,
                padding: '2px 6px', borderRadius: 3, fontWeight: 800, whiteSpace: 'nowrap',
              }}>NOW</div>
            )}
            {(i % 3 === 0 || i === 23) && (
              <span style={{
                fontSize: 10, color: isCurrent ? '#fff' : C.textSec,
                fontFamily: FONT_MONO, fontWeight: 600,
              }}>{i}</span>
            )}
          </div>
        );
      })}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, gap: 12 }}>
      {Object.entries(TIER_INFO).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: v.color, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: C.textSec }}>{v.label}</span>
          <span style={{ fontSize: 12, color: C.text, fontFamily: FONT_MONO, fontWeight: 700 }}>¥{v.price}</span>
        </div>
      ))}
    </div>
  </div>
);

const GanttBar = ({ label, start, end, color, row }) => {
  const left = `${(start / 24) * 100}%`;
  const width = `${((end - start) / 24) * 100}%`;
  return (
    <div style={{
      position: 'absolute', top: row * 32 + 6, left, width, height: 24,
      background: `${color}25`, border: `1px solid ${color}60`,
      borderRadius: 4, display: 'flex', alignItems: 'center',
      paddingLeft: 8, fontSize: 10, color, fontWeight: 700,
      whiteSpace: 'nowrap', overflow: 'hidden',
    }}>
      {label}
    </div>
  );
};

// ── Real Map (使用高德地图截图) ──
const MAP_BASE64 = "data:image/jpeg;base64,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";

const RealMap = () => {
  // Image natural dimensions: 1400 x 698
  // SVG overlay uses the same coordinate system
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '900 / 689',
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      background: '#e8eef4',
    }}>
      {/* Real map background */}
      <img
        src={MAP_BASE64}
        alt="任丘-河间区域地图"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* SVG overlay with markers */}
      <svg viewBox="0 0 900 689" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
      }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="markerGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="markerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Connection: route between charging station and drilling platform */}
        <path
          d="M 405 575 Q 380 380 365 250 Q 355 150 350 80"
          stroke="#0d9b6c"
          strokeWidth="4"
          fill="none"
          strokeDasharray="10 6"
          opacity="0.85"
          filter="url(#markerShadow)"
        />

        {/* Mid-route truck indicator */}
        <g transform="translate(370, 320)" filter="url(#markerShadow)">
          <circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />
          <text x="0" y="5" fill="#ea580c" fontSize="16" textAnchor="middle" fontWeight="900">→</text>
        </g>

        {/* Charging Station marker (沙洼乡) */}
        <g transform="translate(405, 575)" filter="url(#markerShadow)">
          <circle cx="0" cy="0" r="38" fill="#0891b2" opacity="0.18" />
          <circle cx="0" cy="0" r="26" fill="#ffffff" />
          <circle cx="0" cy="0" r="20" fill="#0891b2" stroke="#ffffff" strokeWidth="2.5" />
          <text x="0" y="7" fill="#fff" fontSize="20" textAnchor="middle" fontWeight="900">⚡</text>
        </g>

        {/* Drilling Platform marker (于村乡) - with pulse animation */}
        <g transform="translate(350, 65)" filter="url(#markerShadow)">
          <circle cx="0" cy="0" r="40" fill="#0d9b6c" opacity="0.25">
            <animate attributeName="r" values="34;46;34" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="26" fill="#ffffff" />
          <circle cx="0" cy="0" r="20" fill="#0d9b6c" stroke="#ffffff" strokeWidth="2.5" />
          <text x="0" y="7" fill="#fff" fontSize="20" textAnchor="middle" fontWeight="900">◎</text>
        </g>

        {/* Route distance label */}
        <g transform="translate(400, 320)">
          <rect x="-70" y="-14" width="140" height="26" rx="13"
            fill="#ffffff" stroke="#0d9b6c" strokeWidth="1.5" filter="url(#markerShadow)" />
          <text x="0" y="3" fill="#0d9b6c" fontSize="11" textAnchor="middle" fontWeight="800">
            ≈ 45 km · 50 分钟
          </text>
        </g>
      </svg>

      {/* ── Charging station info card ── */}
      <div style={{
        position: 'absolute', left: '50%', top: '70%', zIndex: 5,
        background: C.bgCard, border: `2px solid ${C.cyan}`,
        borderRadius: 8, padding: '12px 16px', minWidth: 220,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: C.cyanLight, color: C.cyan, fontWeight: 700,
          }}>充电站</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>河间充电站</span>
        </div>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 10 }}>
          河间市沙洼乡 · 1,725 kW · 10kV接入
        </div>
        <div style={{
          fontSize: 12, padding: '5px 10px', borderRadius: 5,
          background: C.bgSubtle, fontFamily: FONT_MONO, color: C.text, fontWeight: 600,
          display: 'inline-block',
        }}>
          <span style={{ color: C.cyan }}>● γ-03</span> 47% 充电中 · 剩余 1h32m
        </div>
      </div>

      {/* ── Drilling platform info card ── */}
      <div style={{
        position: 'absolute', right: '5%', top: '5%', zIndex: 5,
        background: C.bgCard, border: `2px solid ${C.accent}`,
        borderRadius: 8, padding: '12px 16px', minWidth: 240,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 12,
            background: C.accentLight, color: C.accent, fontWeight: 700,
          }}>钻井平台</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>平台 A-01</span>
        </div>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 10 }}>
          任丘市于村乡 · JH-017 井位 · 钻进中
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <div style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 5,
            background: C.bgSubtle, fontFamily: FONT_MONO, color: C.text, fontWeight: 600,
          }}>
            <span style={{ color: C.accent }}>● α-01</span> 62% 供电
          </div>
          <div style={{
            fontSize: 12, padding: '4px 10px', borderRadius: 5,
            background: C.bgSubtle, fontFamily: FONT_MONO, color: C.text, fontWeight: 600,
          }}>
            <span style={{ color: C.blue }}>● β-02</span> 100% 待命
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textSec }}>
          实时放电功率 <span style={{ color: C.text, fontWeight: 800, fontFamily: FONT_MONO }}>680 kW</span>
        </div>
      </div>

      {/* Map header */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: C.bgCard, borderRadius: 8, padding: '8px 14px',
        border: `1px solid ${C.border}`, fontSize: 13,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: C.text, fontWeight: 700 }}>河北省 · 沧州市辖区</span>
        <span style={{ color: C.textMut }}>|</span>
        <span style={{ color: C.textSec, fontFamily: FONT_MONO, fontSize: 12 }}>任丘 ↔ 河间</span>
      </div>

      {/* Map mode toggles */}
      <div style={{
        position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6,
      }}>
        {['卫星', '路网', '标注'].map(t => (
          <span key={t} style={{
            fontSize: 12, padding: '7px 14px', borderRadius: 6,
            background: t === '路网' ? C.accent : C.bgCard,
            color: t === '路网' ? '#fff' : C.textSec,
            border: `1px solid ${t === '路网' ? C.accent : C.border}`,
            cursor: 'pointer', fontWeight: 600,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>{t}</span>
        ))}
      </div>

      {/* Map legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: C.bgCard, borderRadius: 8, padding: '8px 14px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        {[
          { color: C.accent, label: '供电' },
          { color: C.blue, label: '待命' },
          { color: C.cyan, label: '充电' },
          { color: C.orange, label: '运输' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main ──
export default function MainConsole() {
  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: '100vh',
      fontFamily: FONT_SANS,
    }}>
      {/* ── Top Nav ── */}
      <div style={{
        height: 64, background: C.bgCard,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 28px', gap: 24,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}>
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
            color: i === 0 ? C.accent : C.textSec,
            padding: '8px 14px', borderRadius: 7,
            background: i === 0 ? C.accentLight : 'transparent',
            transition: 'all 0.15s',
          }}>{item}</span>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 8, paddingLeft: 16, borderLeft: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>
            2026-04-16 14:32
          </span>
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

      {/* ── Content ── */}
      <div style={{ padding: '24px 28px', maxWidth: 1480, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
              主控台
            </h1>
            <p style={{ fontSize: 13, color: C.textSec, margin: '6px 0 0 0' }}>
              实时监控全部钻井平台供电状态、电池调度执行情况与电价优化效果
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.bgCard, color: C.textSec,
              border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>导出报表</span>
            <span style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.accent, color: '#fff',
              cursor: 'pointer', fontWeight: 600,
              boxShadow: `0 2px 6px ${C.accent}40`,
            }}>+ 手动调度</span>
          </div>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <KPICard icon="⚡" label="供电状态" value="正常" unit="" color={C.accent}
            sub="α-01 供电中 · 预计可持续至 17:30" />
          <KPICard icon="◎" label="实时功率" value="680" unit="kW" color={C.blue}
            sub="平台 A-01 钻井负荷" />
          <KPICard icon="▦" label="电池在线" value="3/3" unit="" color={C.cyan}
            sub="供电 1 · 待命 1 · 充电 1" />
          <KPICard icon="↓" label="实时放电功率" value="680" unit="kW" color={C.orange}
            sub="α-01 → 平台 A-01 · 持续供电中" />
          <KPICard icon="△" label="活跃告警" value="1" unit="" color={C.red}
            sub="γ-03 充电功率异常" />
        </div>

        {/* Main grid: Map + Side panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 16 }}>
          {/* Left: Real Map */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  实时态势监控
                </h3>
                <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                  GPS + 4G 实时追踪 · 1 充电站 / 1 钻井平台 / 3 块电池
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: C.accent,
                  boxShadow: `0 0 8px ${C.accent}`,
                }} />
                <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>实时连接</span>
              </div>
            </div>

            <RealMap />
          </div>

          {/* Right: Battery + Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: C.text,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>电池状态</span>
              <span style={{ fontSize: 11, color: C.textMut, fontWeight: 500 }}>容量 5,000 kWh/块</span>
            </div>
            {BATTERIES.map(b => <BatteryCard key={b.id} b={b} />)}

            {/* Activity feed */}
            <div style={{ marginTop: 6 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>动态消息</span>
                <span style={{ fontSize: 11, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>查看全部 →</span>
              </div>
              {ALERTS.map((a, i) => {
                const colors = {
                  warn: C.orange, ok: C.accent, info: C.blue,
                };
                const bgs = {
                  warn: C.orangeLight, ok: C.accentLight, info: C.blueLight,
                };
                return (
                  <div key={i} style={{
                    padding: '10px 14px', marginBottom: 8, borderRadius: 8,
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${colors[a.level]}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{
                      fontSize: 11, color: colors[a.level], fontFamily: FONT_MONO,
                      flexShrink: 0, fontWeight: 700, padding: '2px 6px',
                      background: bgs[a.level], borderRadius: 3,
                    }}>{a.time}</span>
                    <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{a.msg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom row: Price + Gantt */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
          {/* Price */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  分时电价 · 春季
                </h3>
                <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                  河北电网 · 1-10kV 单一制
                </p>
              </div>
              <div style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 7,
                background: TIER_INFO[HOURS_TIER[CURRENT_HOUR]].color,
                color: '#fff', fontWeight: 700, fontFamily: FONT_MONO,
              }}>
                当前 ¥{TIER_INFO[HOURS_TIER[CURRENT_HOUR]].price}/度
              </div>
            </div>
            <PriceTimeline />
          </div>

          {/* Gantt */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  AI 调度计划
                </h3>
                <p style={{ fontSize: 12, color: C.textSec, margin: '3px 0 0 0' }}>
                  MILP 全局优化 + RL 实时调整 · 24h 滚动窗口
                </p>
              </div>
              <span style={{
                fontSize: 11, color: C.accent, fontFamily: FONT_MONO, fontWeight: 700,
                padding: '4px 10px', borderRadius: 4, background: C.accentLight,
              }}>● 已优化</span>
            </div>

            <div style={{ position: 'relative' }}>
              {/* Time axis */}
              <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 42 }}>
                {Array.from({length: 13}).map((_, i) => (
                  <span key={i} style={{
                    flex: 1, fontSize: 10, color: C.textSec,
                    textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 600,
                  }}>{(i * 2).toString().padStart(2, '0')}</span>
                ))}
              </div>

              <div style={{ position: 'relative', height: 104 }}>
                {['α-01', 'β-02', 'γ-03'].map((name, i) => (
                  <div key={name} style={{
                    position: 'absolute', left: 0, top: i * 32 + 12,
                    fontSize: 11, color: C.text, fontFamily: FONT_MONO, fontWeight: 700,
                  }}>{name}</div>
                ))}

                <div style={{ marginLeft: 42, position: 'relative', height: 104 }}>
                  {/* Vertical grid */}
                  {Array.from({length: 25}).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute', left: `${(i/24)*100}%`, top: 0, bottom: 0,
                      borderLeft: `1px solid ${C.divider}`,
                    }} />
                  ))}

                  {/* Now line */}
                  <div style={{
                    position: 'absolute', left: `${(CURRENT_HOUR/24)*100}%`, top: -2, bottom: -2,
                    borderLeft: `2px solid ${C.accent}`, zIndex: 10,
                  }}>
                    <div style={{
                      position: 'absolute', top: -10, left: -14,
                      fontSize: 9, color: '#fff', background: C.accent,
                      padding: '2px 6px', borderRadius: 3, fontWeight: 800,
                    }}>NOW</div>
                  </div>

                  <GanttBar label="供电" start={0} end={6} color={C.accent} row={0} />
                  <GanttBar label="换" start={6} end={6.25} color={C.purple} row={0} />
                  <GanttBar label="运输" start={6.25} end={7} color={C.orange} row={0} />
                  <GanttBar label="充电(谷)" start={7} end={10} color={C.cyan} row={0} />
                  <GanttBar label="待命" start={10.75} end={14.25} color={C.blue} row={0} />
                  <GanttBar label="供电" start={14.5} end={22} color={C.accent} row={0} />

                  <GanttBar label="待命" start={0} end={2.5} color={C.blue} row={1} />
                  <GanttBar label="充电(深谷)" start={3.25} end={5.75} color={C.cyan} row={1} />
                  <GanttBar label="供电" start={6.25} end={14.25} color={C.accent} row={1} />
                  <GanttBar label="充电(平)" start={15.25} end={18.25} color={C.cyan} row={1} />
                  <GanttBar label="待命" start={19} end={24} color={C.blue} row={1} />

                  <GanttBar label="充电(深谷)" start={0} end={3} color={C.cyan} row={2} />
                  <GanttBar label="待命" start={3.75} end={24} color={C.blue} row={2} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 24, padding: '16px 0',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: C.textMut }}>
            电池智能调度平台 · 上海神机智物人工智能科技有限公司 © 2026
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 11, color: C.textMut }}>
              系统延迟 <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>12 ms</span>
            </span>
            <span style={{ fontSize: 11, color: C.textMut }}>
              MQTT <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>● 已连接</span>
            </span>
            <span style={{ fontSize: 11, color: C.textMut }}>
              数据刷新 <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>30s</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
