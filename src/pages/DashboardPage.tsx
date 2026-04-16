import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MetricRow from '../components/MetricRow';
import MapView from '../components/MapView';
import MapScenarioPanel from '../components/MapScenarioPanel';
import PriceBar from '../components/PriceBar';
import Gantt from '../components/Gantt';
import LogPanel from '../components/LogPanel';
import Panel from '../components/Panel';
import EnergySparkline from '../components/EnergySparkline';
import { C } from '../constants/colors';
import { LOGS } from '../constants/logs';
import { simBatteries } from '../utils/simulation';
import { PLATFORM_BASE_TOTAL, PLATFORMS } from '../data/platforms';
import { HISTORY_STATS } from '../data/history';
import { useAppContext } from '../hooks/useAppContext';

const DEMO_SECS = 22; // 每个场景压缩到 22 秒回放

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

  /* ── 场景演练状态 ── */
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scenarioRunning || !scenarioId) return;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const ratio = Math.min(1, (ts - startRef.current) / 1000 / DEMO_SECS);
      setScenarioProgress(ratio);
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setScenarioRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [scenarioRunning, scenarioId]);

  const handleScenarioSelect = useCallback((id: string) => {
    if (id === scenarioId) return;
    setScenarioId(id);
    setScenarioProgress(0);
    setScenarioRunning(false);
  }, [scenarioId]);

  const handleScenarioClose = useCallback(() => {
    setScenarioId(null);
    setScenarioProgress(0);
    setScenarioRunning(false);
  }, []);

  const toggleScenarioRunning = useCallback(() => {
    if (!scenarioId) return;
    if (scenarioProgress >= 1) {
      // reset + play
      setScenarioProgress(0);
      setScenarioRunning(true);
    } else {
      setScenarioRunning((r) => !r);
    }
  }, [scenarioId, scenarioProgress]);

  return (
    <div>
      {/* KPI */}
      <MetricRow batteries={batteries} power={power} energy={energy} />

      {/* 地图 + 场景热点 + 内嵌场景面板 */}
      <Panel
        title="实时态势监控"
        extra={
          <span>
            GPS + 4G · 3 平台 / 2 充电站 · {batteries.length} 块电池 ·{' '}
            <span style={{ color: C.cyan }}>↑ 充电</span>{' '}
            <span style={{ color: C.accent }}>↓ 放电</span>{' '}
            <span style={{ color: C.textMut }}>· 点击地图热点启动极端场景</span>
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ height: 540 }}>
          <MapView
            batteries={batteries}
            simHour={simHour}
            activeScenarioId={scenarioId}
            scenarioProgress={scenarioProgress}
            onScenarioClick={handleScenarioSelect}
          />
        </div>
        <MapScenarioPanel
          activeId={scenarioId}
          progress={scenarioProgress}
          onSelect={handleScenarioSelect}
          onClose={handleScenarioClose}
          running={scenarioRunning}
          onToggle={toggleScenarioRunning}
        />
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
