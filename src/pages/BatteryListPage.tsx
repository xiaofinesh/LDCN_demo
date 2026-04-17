import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_MONO } from '../constants/tokens';
import { api } from '../api/client';

interface BatteryData {
  id: number;
  name: string;
  serial: string;
  soc: number;
  soh: number;
  status: string;
  location: string;
  power: number;
  voltage: number;
  current: number;
  temp: number;
  capacity: number;
  cycles: number;
  monthlySaving: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  supplying: { label: '供电中', color: '#0d9b6c', bg: '#d1f4e3', icon: '⚡' },
  standby:   { label: '待命',   color: '#2563eb', bg: '#dbeafe', icon: '◉' },
  charging:  { label: '充电中', color: '#0891b2', bg: '#cffafe', icon: '↑' },
  to_station:{ label: '运输中', color: '#ea580c', bg: '#ffedd5', icon: '→' },
};

const BatteryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [batteries, setBatteries] = useState<BatteryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ batteries: BatteryData[] }>('/api/batteries')
      .then((r) => setBatteries(r.batteries))
      .catch(() => {})
      .finally(() => setLoading(false));
    const iv = setInterval(() => {
      api.get<{ batteries: BatteryData[] }>('/api/batteries')
        .then((r) => setBatteries(r.batteries))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
            电池管理
          </h1>
          <p style={{ fontSize: 13, color: C.textSec, margin: '6px 0 0 0' }}>
            管理全部电池组的运行状态、健康度与经济贡献
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
          }} />
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>
            实时连接 · 5s 刷新
          </span>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        {[
          { label: '电池总数', value: batteries.length, unit: '块', color: C.accent },
          { label: '在线供电', value: batteries.filter(b => b.status === 'supplying').length, unit: '块', color: '#0d9b6c' },
          { label: '充电中', value: batteries.filter(b => b.status === 'charging').length, unit: '块', color: '#0891b2' },
          { label: '平均 SOH', value: batteries.length ? Math.round(batteries.reduce((a, b) => a + b.soh, 0) / batteries.length) : '-', unit: '%', color: '#7c3aed' },
          { label: '本月累计节省', value: batteries.length ? `¥${batteries.reduce((a, b) => a + b.monthlySaving, 0).toLocaleString()}` : '-', unit: '', color: C.accent },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            flex: 1, minWidth: 160,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            <div style={{ fontSize: 12, color: C.textSec, fontWeight: 600, marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{
                fontSize: 28, fontWeight: 800, color: kpi.color,
                fontFamily: FONT_MONO, letterSpacing: -1, lineHeight: 1,
              }}>{kpi.value}</span>
              <span style={{ fontSize: 12, color: C.textMut, fontWeight: 500 }}>{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Battery cards */}
      {loading && <div style={{ padding: 40, textAlign: 'center', color: C.textMut }}>加载中...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {batteries.map((b) => {
          const st = STATUS_MAP[b.status] ?? { label: b.status, color: C.textMut, bg: C.bgSubtle, icon: '?' };
          const socColor = b.soc > 60 ? C.accent : b.soc > 25 ? C.orange : C.red;
          const r = 38, stroke = 5;
          const circ = 2 * Math.PI * r;
          const offset = circ * (1 - b.soc / 100);

          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/battery/${b.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/battery/${b.id}`); }}
              style={{
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${st.color}18`;
                (e.currentTarget as HTMLDivElement).style.borderColor = st.color;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)';
                (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 22, fontWeight: 800, color: C.text, fontFamily: FONT_MONO,
                  }}>{b.name}</span>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 12,
                    background: st.bg, color: st.color, fontWeight: 700,
                  }}>
                    {st.icon} {st.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: C.textMut }}>›</span>
              </div>

              {/* SOC ring + info */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                {/* SOC ring */}
                <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                  <svg viewBox="0 0 90 90" style={{ width: 90, height: 90 }}>
                    <circle cx="45" cy="45" r={r} fill="none" stroke={C.divider} strokeWidth={stroke} />
                    <circle cx="45" cy="45" r={r} fill="none" stroke={socColor} strokeWidth={stroke}
                      strokeDasharray={circ} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 45 45)"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{
                      fontSize: 22, fontWeight: 800, color: socColor, fontFamily: FONT_MONO, lineHeight: 1,
                    }}>{Math.round(b.soc)}</span>
                    <span style={{ fontSize: 9, color: C.textMut, marginTop: 2 }}>SOC %</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>功率</div>
                    <span style={{
                      fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO,
                      color: b.power < 0 ? C.accent : b.power > 0 ? '#0891b2' : C.textSec,
                    }}>
                      {b.power > 0 ? '+' : ''}{b.power} kW
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>温度</div>
                    <span style={{
                      fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO,
                      color: b.temp > 35 ? C.orange : C.text,
                    }}>
                      {b.temp.toFixed(1)} °C
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>健康度</div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO, color: C.text }}>
                      {b.soh}%
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textMut, marginBottom: 2 }}>本月节省</div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT_MONO, color: C.accent }}>
                      ¥{b.monthlySaving.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location + serial */}
              <div style={{
                marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.divider}`,
                display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMut,
              }}>
                <span>📍 {b.location}</span>
                <span style={{ fontFamily: FONT_MONO }}>{b.serial}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BatteryListPage;
