import React, { useMemo } from 'react';
import Panel from '../components/Panel';
import MapView from '../components/MapView';
import { C } from '../constants/colors';
import { PLATFORMS, STATIONS } from '../data/platforms';
import { simBatteries } from '../utils/simulation';
import { useAppContext } from '../hooks/useAppContext';

const PlatformsPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);

  return (
    <div>
      <Panel title="多平台拓扑地图" extra="河北省 · 沧州 / 保定交界">
        <div style={{ height: 500 }}>
          <MapView batteries={batteries} simHour={simHour} />
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
        {PLATFORMS.map((p) => {
          const fleet = batteries.filter((b) => b.platformId === p.id);
          const load = Math.round(p.baseLoad + Math.sin(simHour * 1.3 + p.id) * 90);
          const supply = fleet.find((b) => b.st === 'supplying');
          return (
            <Panel key={p.id} title={p.name} extra={p.location}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.textMut, marginBottom: 3 }}>实时负荷</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: "'Courier New',monospace" }}>
                    {load}
                    <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 3 }}>kW</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: C.textMut, marginBottom: 3 }}>当前供电</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "'Courier New',monospace" }}>
                    {supply?.name || '—'}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 6,
                  paddingTop: 10,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {fleet.map((b) => {
                  const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '6px 8px',
                        background: `${C.border}30`,
                        borderRadius: 6,
                        border: `1px solid ${socC}22`,
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, color: C.textSec, fontFamily: "'Courier New',monospace" }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: socC, fontFamily: "'Courier New',monospace" }}>
                        {Math.round(b.soc)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
        {STATIONS.map((s) => (
          <Panel key={s.id} title={s.name} extra={`${s.voltage} · ${s.location}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: C.textMut }}>装机容量</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.blue,
                    fontFamily: "'Courier New',monospace",
                  }}
                >
                  {s.capacity.toLocaleString()}
                  <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 3 }}>kW</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: C.textMut }}>当前在充</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: C.accent,
                    fontFamily: "'Courier New',monospace",
                  }}
                >
                  {batteries.filter((b) => b.st === 'charging').length}
                  <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 3 }}>块</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textMut, lineHeight: 1.6 }}>
              · 双路 10kV 进线，冗余设计
              <br />· 8 路 180kW DC 充电桩 + 6 路 60kW 慢充
              <br />· 支持 V2G 并网返送，峰谷套利协同
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
};

export default PlatformsPage;
