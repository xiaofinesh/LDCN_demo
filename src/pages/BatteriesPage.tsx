import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import { C } from '../constants/colors';
import { SC, SL } from '../constants/status';
import { PLATFORMS } from '../data/platforms';
import { simBatteries } from '../utils/simulation';
import { useAppContext } from '../hooks/useAppContext';
import type { Battery } from '../types';

const BatteriesPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);
  const [selected, setSelected] = useState<number>(1);

  const active = batteries.find((b) => b.id === selected) || batteries[0];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        <Panel title="电池组列表" extra={`共 ${batteries.length} 块 · 总容量 ${(batteries.reduce((a, b) => a + b.capacity, 0) / 1000).toFixed(0)} MWh`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: C.textMut, fontSize: 10, fontWeight: 500 }}>
                {['编号', '所属平台', 'SOC', '状态', '功率', 'SOH', '循环', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 10px',
                      textAlign: h === '编号' || h === '所属平台' || h === '状态' ? 'left' : 'right',
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batteries.map((b) => {
                const sc = SC[b.st];
                const pl = PLATFORMS.find((p) => p.id === b.platformId);
                const active = b.id === selected;
                const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b.id)}
                    style={{
                      cursor: 'pointer',
                      background: active ? `${C.accent}0c` : 'transparent',
                      borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
                      transition: 'background .15s',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 10px',
                        fontFamily: "'Courier New',monospace",
                        fontWeight: 700,
                        color: C.text,
                        letterSpacing: 1,
                      }}
                    >
                      {b.name}
                    </td>
                    <td style={{ padding: '10px 10px', color: C.textSec }}>{pl?.name || '-'}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: socC, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>
                      {Math.round(b.soc)}%
                    </td>
                    <td style={{ padding: '10px 10px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: `${sc}18`,
                          color: sc,
                          border: `1px solid ${sc}30`,
                          fontWeight: 600,
                        }}
                      >
                        {SL[b.st]}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px 10px',
                        textAlign: 'right',
                        color: b.power > 0 ? C.cyan : b.power < 0 ? C.accent : C.textMut,
                        fontFamily: "'Courier New',monospace",
                        fontWeight: 700,
                      }}
                    >
                      {b.power === 0
                        ? '—'
                        : `${b.power > 0 ? '+' : ''}${Math.round(b.power)}`}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: C.textSec, fontFamily: "'Courier New',monospace" }}>
                      {b.soh}%
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', color: C.textMut, fontFamily: "'Courier New',monospace" }}>
                      {b.cycles}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', color: C.accent }}>›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <BatteryDetail b={active} />
      </div>
    </div>
  );
};

/** ────────────────────── detail pane ────────────────────── */
const BatteryDetail: React.FC<{ b: Battery }> = ({ b }) => {
  const sc = SC[b.st];
  const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
  const pl = PLATFORMS.find((p) => p.id === b.platformId);

  const parameters: Array<{ k: string; v: string }> = [
    { k: '电池型号', v: 'LiFePO4 · 磷酸铁锂' },
    { k: '标称电压', v: '1500 V' },
    { k: '标称容量', v: `${b.capacity.toLocaleString()} kWh` },
    { k: '最大功率', v: '2500 kW' },
    { k: '工作温度', v: '-20 ~ 60 ℃' },
    { k: '循环寿命', v: '≥ 6000 次 @ 80% DOD' },
    { k: '防护等级', v: 'IP54' },
    { k: '外形尺寸', v: '12.2 × 2.4 × 2.6 m' },
  ];

  return (
    <Panel title={`${b.name} · 电池详情`} extra={pl?.name || ''}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.text,
              fontFamily: "'Courier New',monospace",
              letterSpacing: 2,
            }}
          >
            {b.name}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 20,
              background: `${sc}15`,
              color: sc,
              fontWeight: 600,
              border: `1px solid ${sc}30`,
              display: 'inline-block',
            }}
          >
            {SL[b.st]}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: socC,
              fontFamily: "'Courier New',monospace",
              lineHeight: 1,
            }}
          >
            {Math.round(b.soc)}
            <span style={{ fontSize: 16, opacity: 0.7 }}>%</span>
          </div>
          <div style={{ fontSize: 10, color: C.textMut, marginTop: 4 }}>SOC</div>
        </div>
      </div>

      <div
        style={{
          height: 8,
          background: `${C.border}80`,
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${b.soc}%`,
            height: '100%',
            borderRadius: 4,
            background: `linear-gradient(90deg, ${socC}80, ${socC})`,
            transition: 'width .6s ease',
            boxShadow: `0 0 10px ${socC}40`,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        <InfoChip label="SOH" value={`${b.soh}%`} color={C.accent} />
        <InfoChip label="循环次数" value={b.cycles.toString()} color={C.blue} />
        <InfoChip
          label={b.power > 0 ? '充电功率' : b.power < 0 ? '放电功率' : '功率'}
          value={b.power === 0 ? '0 kW' : `${b.power > 0 ? '+' : ''}${Math.round(b.power).toLocaleString()} kW`}
          color={b.power > 0 ? C.cyan : b.power < 0 ? C.accent : C.textMut}
        />
        <InfoChip label="可用能量" value={`${Math.round((b.soc / 100) * b.capacity * 0.95).toLocaleString()} kWh`} color={C.purple} />
      </div>

      <div style={{ fontSize: 11, color: C.textSec, fontWeight: 700, marginBottom: 8 }}>参数规格</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {parameters.map((p, i) => (
          <div
            key={p.k}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              fontSize: 11,
              borderBottom: i < parameters.length - 1 ? `1px solid ${C.border}80` : 'none',
              background: i % 2 === 0 ? 'transparent' : `${C.border}20`,
            }}
          >
            <span style={{ color: C.textMut }}>{p.k}</span>
            <span style={{ color: C.textSec, fontFamily: "'Courier New',monospace" }}>{p.v}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

const InfoChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      background: `${color}0c`,
      border: `1px solid ${color}22`,
      borderRadius: 8,
      padding: '8px 10px',
    }}
  >
    <div style={{ fontSize: 9, color: C.textMut, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Courier New',monospace" }}>{value}</div>
  </div>
);

export default BatteriesPage;
