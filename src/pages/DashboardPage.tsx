import React, { useMemo } from 'react';
import MetricRow from '../components/MetricRow';
import MapView from '../components/MapView';
import BatteryHUD from '../components/BatteryHUD';
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
  // 3 平台实时负荷：基线合计 + 双频正弦波动（± ~230 kW）
  const power = Math.round(
    PLATFORM_BASE_TOTAL +
      Math.sin(simHour * 1.3) * 180 +
      Math.sin(simHour * 3.7) * 90,
  );
  // 累计用电（kWh）：按平台基线总功率线性积分
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

      {/* 地图 + 电池 HUD 阵列 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Panel title="实时态势监控" extra="GPS + 4G 实时追踪 · 3 平台 / 2 充电站">
          <div style={{ height: 420 }}>
            <MapView batteries={batteries} simHour={simHour} />
          </div>
        </Panel>

        <Panel
          title="电池组 HUD 实时监控"
          extra={
            <span style={{ color: C.textMut }}>
              8 块 · 总容量 40 MWh ·{' '}
              <span style={{ color: C.cyan, fontFamily: "'Courier New',monospace" }}>↓ 充电</span>{' '}
              <span style={{ color: C.accent, fontFamily: "'Courier New',monospace" }}>↑ 放电</span>
            </span>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {batteries.map((b) => (
              <BatteryHUD key={b.id} b={b} />
            ))}
          </div>
        </Panel>
      </div>

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
          <div style={{ fontSize: 10, color: C.textMut, marginTop: 8, lineHeight: 1.6 }}>
            · 红点为钻探密集日（D-{HISTORY_STATS.maxDay}，{HISTORY_STATS.max.toLocaleString()} kWh），橙点为停机日（D-{HISTORY_STATS.minDay}，{HISTORY_STATS.min.toLocaleString()} kWh）
            <br />· 青色虚线为当日实时累计／单平台，系统按日内实际负荷滚动测算
          </div>
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
