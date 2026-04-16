import React, { useMemo } from 'react';
import MetricRow from '../components/MetricRow';
import MapView from '../components/MapView';
import PriceBar from '../components/PriceBar';
import Gantt from '../components/Gantt';
import LogPanel from '../components/LogPanel';
import Panel from '../components/Panel';
import ScenarioCarousel from '../components/ScenarioCarousel';
import EnergySparkline from '../components/EnergySparkline';
import { C } from '../constants/colors';
import { LOGS } from '../constants/logs';
import { simBatteries } from '../utils/simulation';
import { PLATFORM_BASE_TOTAL, PLATFORMS } from '../data/platforms';
import { HISTORY_STATS } from '../data/history';
import { useAppContext } from '../hooks/useAppContext';

const DashboardPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);
  const power = Math.round(
    PLATFORM_BASE_TOTAL +
      Math.sin(simHour * 1.3) * 180 +
      Math.sin(simHour * 3.7) * 90,
  );
  const energy = Math.round(simHour * PLATFORM_BASE_TOTAL);
  const perPlatformToday = Math.round(energy / PLATFORMS.length);
  const logs = LOGS.filter((l) => {
    const [hh, mm] = l.t.split(':').map(Number);
    return hh + mm / 60 <= simHour + 0.1;
  });

  return (
    <div>
      {/* 顶部：极端场景轮播 */}
      <ScenarioCarousel />

      {/* KPI */}
      <MetricRow batteries={batteries} power={power} energy={energy} />

      {/* 地图（全宽） — 电池 HUD 已融入 */}
      <Panel
        title="实时态势监控"
        extra={
          <span>
            GPS + 4G 实时追踪 · 3 平台 / 2 充电站 · {batteries.length} 块电池 ·{' '}
            <span style={{ color: C.cyan }}>↑ 充电</span>{' '}
            <span style={{ color: C.accent }}>↓ 放电</span>
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ height: 540 }}>
          <MapView batteries={batteries} simHour={simHour} />
        </div>
      </Panel>

      {/* 75 天趋势 + 分时电价 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Panel
          title="75 天单平台用电趋势"
          extra={
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10 }}>
              <span style={{ color: C.accent }}>均值 {HISTORY_STATS.mean.toLocaleString()}</span> ·{' '}
              <span style={{ color: C.purple }}>中位 {HISTORY_STATS.median.toLocaleString()}</span> ·{' '}
              <span style={{ color: C.red }}>波动 {Math.round(HISTORY_STATS.cv * 100)}%</span>
            </span>
          }
        >
          <EnergySparkline todayPerPlatform={perPlatformToday} />
        </Panel>

        <Panel title="分时电价 · 春季" extra="河北电网 · 1-10kV">
          <PriceBar simHour={simHour} />
        </Panel>
      </div>

      {/* 甘特 */}
      <Panel title="调度计划 · 全机组" extra={<span style={{ color: C.accent }}>MILP 优化引擎</span>} style={{ marginBottom: 16 }}>
        <Gantt batteries={batteries} simHour={simHour} dense />
      </Panel>

      {/* 日志 */}
      <LogPanel logs={logs} />
    </div>
  );
};

export default DashboardPage;
