import React, { useMemo } from 'react';
import { C } from './constants/colors';
import { LOGS } from './constants/logs';
import { useSimulation } from './hooks/useSimulation';
import { simBatteries } from './utils/simulation';
import Header from './components/Header';
import MetricRow from './components/MetricRow';
import MapView from './components/MapView';
import BatteryCards from './components/BatteryCards';
import PriceBar from './components/PriceBar';
import Gantt from './components/Gantt';
import LogPanel from './components/LogPanel';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { simHour, running, setRunning, speed, setSpeed } = useSimulation();

  const batteries = useMemo(() => simBatteries(simHour), [simHour]);
  const power = Math.round(471 + Math.sin(simHour * 1.3) * 150 + Math.sin(simHour * 3.7) * 80);
  const energy = Math.round(simHour * 471);
  const logs = LOGS.filter((l) => {
    const [hh, mm] = l.t.split(':').map(Number);
    return hh + mm / 60 <= simHour + 0.1;
  });

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        minHeight: '100vh',
        fontFamily: "'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif",
        padding: '20px 24px',
        boxSizing: 'border-box',
      }}
    >
      <Header
        simHour={simHour}
        running={running}
        setRunning={setRunning}
        speed={speed}
        setSpeed={setSpeed}
      />

      <MetricRow batteries={batteries} power={power} energy={energy} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Map */}
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.textSec,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>实时态势监控</span>
            <span style={{ fontSize: 10, color: C.textMut, fontWeight: 400 }}>GPS + 4G 实时追踪</span>
          </div>
          <MapView batteries={batteries} simHour={simHour} />
        </div>

        {/* Battery Cards */}
        <BatteryCards batteries={batteries} power={power} />

        {/* Price */}
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.textSec,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>分时电价 · 春季</span>
            <span style={{ fontSize: 10, color: C.textMut, fontWeight: 400 }}>河北电网 · 1-10kV</span>
          </div>
          <PriceBar simHour={simHour} />
        </div>

        {/* Gantt */}
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.textSec,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>调度计划</span>
            <span
              style={{
                fontSize: 10,
                color: C.accent,
                fontWeight: 700,
                fontFamily: "'Courier New',monospace",
              }}
            >
              MILP 优化引擎
            </span>
          </div>
          <Gantt batteries={batteries} simHour={simHour} />
        </div>

        {/* Log */}
        <LogPanel logs={logs} />
      </div>

      <Footer />
    </div>
  );
};

export default App;
