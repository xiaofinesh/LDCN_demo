import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_MONO } from '../constants/tokens';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

// ── Types ──
type BatteryStatus = 'supplying' | 'standby' | 'charging' | 'to_station';
type TierKey = 'spike' | 'peak' | 'flat' | 'valley' | 'deepValley';
type AlertLevel = 'info' | 'warn' | 'ok';

interface BatteryData {
  id: number;
  name: string;
  soc: number;
  status: BatteryStatus;
  location: string;
  power: number;
  temp: number;
}

// ── Battery data ──
const BATTERIES: BatteryData[] = [
  { id: 1, name: 'α-01', soc: 62, status: 'supplying', location: '钻井平台 A-01', power: -680, temp: 32.5 },
  { id: 2, name: 'β-02', soc: 100, status: 'standby', location: '钻井平台 A-01', power: 0, temp: 28.1 },
  { id: 3, name: 'γ-03', soc: 47, status: 'charging', location: '充电站-01 河间', power: 1725, temp: 35.8 },
];

const STATUS_MAP: Record<BatteryStatus, { label: string; color: string; bg: string; icon: string }> = {
  supplying: { label: '供电中', color: C.accent, bg: C.accentLight, icon: '⚡' },
  standby: { label: '待命', color: C.blue, bg: C.blueLight, icon: '◉' },
  charging: { label: '充电中', color: C.cyan, bg: C.cyanLight, icon: '↑' },
  to_station: { label: '运输中', color: C.orange, bg: C.orangeLight, icon: '→' },
};

// ── 五档分时电价 · 春季（河北电网 1-10kV 单一制） ──
const HOURS_TIER: TierKey[] = [
  'flat','flat','flat',                       // 00-02 平段
  'valley','valley','valley','valley',        // 03-06 低谷
  'flat','flat','flat','flat',                // 07-10 平段
  'valley',                                   // 11    低谷
  'deepValley','deepValley','deepValley',     // 12-14 深谷
  'flat',                                     // 15    平段
  'peak','peak','peak',                       // 16-18 高峰
  'spike','spike',                            // 19-20 尖峰
  'peak','peak','peak',                       // 21-23 高峰
];
const TIER_INFO: Record<TierKey, { label: string; color: string; price: number }> = {
  spike:      { label: '尖峰', color: '#dc2626', price: 1.0709 },
  peak:       { label: '高峰', color: '#ea580c', price: 0.9380 },
  flat:       { label: '平段', color: '#2563eb', price: 0.6642 },
  valley:     { label: '低谷', color: '#0891b2', price: 0.3904 },
  deepValley: { label: '深谷', color: '#0d9b6c', price: 0.3669 },
};

const CURRENT_HOUR = 14;

// ── Activity feed ──
const ALERTS: Array<{ level: AlertLevel; time: string; msg: string }> = [
  { level: 'info', time: '14:15', msg: 'α-01 SOC 62% · 预计可持续供电至 17:30' },
  { level: 'warn', time: '14:00', msg: 'γ-03 充电功率下降至 1,520 kW · 较额定值低 12%' },
  { level: 'ok', time: '13:45', msg: '调度计划已更新 · 下次换电 17:30 · β-02 → α-01' },
  { level: 'info', time: '12:30', msg: '钻井平台 A-01 负荷波动 720 kW · RL 引擎评估无需调整' },
];

// ── Components ──

interface KPICardProps {
  label: string;
  value: string | number;
  unit: string;
  sub: string;
  color: string;
  icon: string;
  trend?: number;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, unit, sub, color, icon, trend }) => (
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

const BatteryCard: React.FC<{ b: BatteryData; onOpen: () => void }> = ({ b, onOpen }) => {
  const st = STATUS_MAP[b.status];
  const r = 30, stroke = 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - b.soc / 100);
  const socColor = b.soc > 60 ? C.accent : b.soc > 25 ? C.orange : C.red;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      cursor: 'pointer',
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

interface GanttBarProps { label: string; start: number; end: number; color: string; row: number; }
const GanttBar: React.FC<GanttBarProps> = ({ label, start, end, color, row }) => {
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

const RealMap: React.FC = () => {
  const [layer, setLayer] = useState<'satellite' | 'road' | 'label'>('road');
  const [mapSrc, setMapSrc] = useState<string | null>(null);
  useEffect(() => {
    api.get<{ layer: 'satellite' | 'road' | 'label' }>('/api/map/layer')
      .then((r) => setLayer(r.layer)).catch(() => {});
    // 动态加载地图底图（52KB base64），避免阻塞其他页面
    import('../assets/mapBase64').then((m) => setMapSrc(m.MAP_BASE64));
  }, []);
  const onLayerClick = (label: '卫星' | '路网' | '标注') => {
    const map: Record<string, 'satellite' | 'road' | 'label'> = {
      '卫星': 'satellite', '路网': 'road', '标注': 'label',
    };
    const next = map[label];
    setLayer(next);
    api.post('/api/map/layer', { layer: next }).catch(() => {});
  };
  // Image natural dimensions: 1400 x 698
  // SVG overlay uses the same coordinate system
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '900 / 689',
      borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${C.border}`,
      background: '#e8eef4',
    }}>
      {/* Real map background (动态加载) */}
      {mapSrc ? (
        <img
          src={mapSrc}
          alt="任丘-河间区域地图"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #e8eef4 0%, #dbe3ec 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.textMut, fontSize: 12, fontFamily: FONT_MONO,
          }}
        >
          地图加载中…
        </div>
      )}

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
        {(['卫星', '路网', '标注'] as const).map(t => {
          const map: Record<string, 'satellite' | 'road' | 'label'> = {
            '卫星': 'satellite', '路网': 'road', '标注': 'label',
          };
          const active = layer === map[t];
          return (
          <span key={t} onClick={() => onLayerClick(t)} style={{
            fontSize: 12, padding: '7px 14px', borderRadius: 6,
            background: active ? C.accent : C.bgCard,
            color: active ? '#fff' : C.textSec,
            border: `1px solid ${active ? C.accent : C.border}`,
            cursor: 'pointer', fontWeight: 600,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>{t}</span>
          );
        })}
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
const DashboardPage: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ filename: string; message: string }>('/api/reports/export');
      toast.success(`${r.message}（${r.filename}）`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onManualSchedule = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ message: string; eventId: string }>(
        '/api/scheduling/manual',
        { reason: '主控台手动触发' },
      );
      toast.success(`${r.message}（${r.eventId}）`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* ── NAV_REMOVED — provided by AppLayout ── */}
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
            <button onClick={onExport} style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.bgCard, color: C.textSec,
              border: `1px solid ${C.border}`, cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
            }}>导出报表</button>
            <button onClick={onManualSchedule} style={{
              fontSize: 12, padding: '8px 16px', borderRadius: 7,
              background: C.accent, color: '#fff',
              cursor: 'pointer', fontWeight: 600,
              boxShadow: `0 2px 6px ${C.accent}40`,
              border: 'none', fontFamily: 'inherit',
            }}>+ 手动调度</button>
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
            {BATTERIES.map(b => <BatteryCard key={b.id} b={b} onOpen={() => navigate(`/battery/${b.id}`)} />)}

            {/* Activity feed */}
            <div style={{ marginTop: 6 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10,
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>动态消息</span>
                <span onClick={() => navigate('/alerts')} style={{ fontSize: 11, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>查看全部 →</span>
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

      </div>
    </div>
  );
};

export default DashboardPage;
