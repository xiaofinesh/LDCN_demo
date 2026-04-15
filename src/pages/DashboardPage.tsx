import React, { useMemo } from 'react';
import MetricRow from '../components/MetricRow';
import MapView from '../components/MapView';
import BatteryCards from '../components/BatteryCards';
import PriceBar from '../components/PriceBar';
import Gantt from '../components/Gantt';
import LogPanel from '../components/LogPanel';
import Panel from '../components/Panel';
import { LOGS } from '../constants/logs';
import { simBatteries } from '../utils/simulation';
import { PLATFORMS } from '../data/platforms';
import { useAppContext } from '../hooks/useAppContext';

const DashboardPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);
  const power = Math.round(
    PLATFORMS.reduce((a, p) => a + p.baseLoad, 0) +
      Math.sin(simHour * 1.3) * 180 +
      Math.sin(simHour * 3.7) * 90,
  );
  const energy = Math.round(simHour * 1201);
  const logs = LOGS.filter((l) => {
    const [hh, mm] = l.t.split(':').map(Number);
    return hh + mm / 60 <= simHour + 0.1;
  });

  return (
    <div>
      <MetricRow batteries={batteries} power={power} energy={energy} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 16 }}>
        <Panel title="实时态势监控" extra="GPS + 4G 实时追踪 · 3 平台 / 2 充电站" padding="16px 20px" style={{ gridRow: 'span 1' }}>
          <div style={{ height: 430 }}>
            <MapView batteries={batteries} simHour={simHour} />
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BatteryCards batteries={batteries.slice(0, 3)} power={power} />
        </div>

        <Panel title="分时电价 · 春季" extra="河北电网 · 1-10kV">
          <PriceBar simHour={simHour} />
        </Panel>

        <Panel title="调度计划" extra={<span style={{ color: '#22d3a7' }}>MILP 优化引擎</span>}>
          <Gantt batteries={batteries.slice(0, 3)} simHour={simHour} dense />
        </Panel>

        <div style={{ gridColumn: '1 / -1' }}>
          <LogPanel logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
