import React, { useEffect, useRef, useState } from 'react';
import Panel from '../components/Panel';
import Metric from '../components/Metric';
import { C } from '../constants/colors';
import { SCENARIOS, severityColor, severityLabel } from '../data/scenarios';
import type { Scenario } from '../data/scenarios';

const ExtremeScenariosPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const selected = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  // 演练运行控制
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // 秒
  /** 演练倍速：将真实持续时长压缩到 N 秒展示 */
  const [demoSeconds] = useState(20);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const dt = (ts - startRef.current) / 1000; // 秒
      const ratio = Math.min(1, dt / demoSeconds);
      const simSec = ratio * selected.duration;
      setElapsed(simSec);
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, demoSeconds, selected.duration]);

  // 切换场景重置进度
  useEffect(() => {
    setRunning(false);
    setElapsed(0);
  }, [selectedId]);

  const startDemo = () => {
    setElapsed(0);
    setRunning(true);
  };

  const resetDemo = () => {
    setRunning(false);
    setElapsed(0);
  };

  // KPI 计算
  const totalScenarios = SCENARIOS.length;
  const extremeCount = SCENARIOS.filter((s) => s.severity === 'extreme').length;
  const criticalCount = SCENARIOS.filter((s) => s.severity === 'critical').length;
  const avgDuration = Math.round(
    SCENARIOS.reduce((a, s) => a + s.duration, 0) / SCENARIOS.length / 60,
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Metric label="预案总数" value={totalScenarios} unit="项" color={C.accent} sub="覆盖市场/设备/通讯/天气" animated />
        <Metric label="极端场景" value={extremeCount} unit="项" color={C.purple} sub="不可抗力级别" animated />
        <Metric label="严重场景" value={criticalCount} unit="项" color={C.red} sub="影响生产" animated />
        <Metric label="平均处置时长" value={avgDuration} unit="分钟" color={C.blue} sub="MILP+RL 全自动" animated />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* 场景列表 */}
        <Panel title="场景库" extra={`${SCENARIOS.length} 项预案`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCENARIOS.map((s) => {
              const active = s.id === selectedId;
              const sevC = severityColor(s.severity);
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1px solid ${active ? sevC : C.border}`,
                    background: active ? `${sevC}10` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: `${sevC}18`,
                        color: sevC,
                        border: `1px solid ${sevC}30`,
                        fontWeight: 700,
                      }}
                    >
                      {severityLabel(s.severity)}
                    </span>
                    <span style={{ fontSize: 9, color: C.textMut, fontFamily: "'Courier New',monospace" }}>
                      {formatDuration(s.duration)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? sevC : C.text, marginBottom: 3 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMut, fontWeight: 500, letterSpacing: 0.5 }}>
                    · {s.tag}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* 场景详情 + 演练 */}
        <ScenarioDetail
          scenario={selected}
          running={running}
          elapsed={elapsed}
          onStart={startDemo}
          onReset={resetDemo}
        />
      </div>
    </div>
  );
};

const formatDuration = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} 分钟`;
  return `${(sec / 3600).toFixed(sec % 3600 === 0 ? 0 : 1)} 小时`;
};

const ScenarioDetail: React.FC<{
  scenario: Scenario;
  running: boolean;
  elapsed: number;
  onStart: () => void;
  onReset: () => void;
}> = ({ scenario, running, elapsed, onStart, onReset }) => {
  const sevC = severityColor(scenario.severity);
  const progressPct = Math.min(100, (elapsed / scenario.duration) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel
        title={
          <span>
            <span
              style={{
                fontSize: 9,
                padding: '2px 8px',
                borderRadius: 10,
                background: `${sevC}18`,
                color: sevC,
                border: `1px solid ${sevC}30`,
                fontWeight: 700,
                marginRight: 10,
              }}
            >
              {severityLabel(scenario.severity)} · {scenario.tag}
            </span>
            {scenario.title}
          </span>
        }
        extra={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onStart}
              disabled={running}
              style={{
                background: running ? `${C.border}40` : `${C.accent}18`,
                color: running ? C.textMut : C.accent,
                border: `1px solid ${running ? C.border : C.accent}40`,
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? '▶ 演练中…' : '▶ 启动演练'}
            </button>
            <button
              onClick={onReset}
              style={{
                background: 'transparent',
                color: C.textSec,
                border: `1px solid ${C.border}`,
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↺ 重置
            </button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <InfoBlock label="触发条件" value={scenario.trigger} color={sevC} />
          <InfoBlock label="影响范围" value={scenario.impact} color={C.amber} />
          <InfoBlock label="预期结果" value={scenario.outcome} color={C.accent} />
        </div>

        {/* 演练时长进度条 */}
        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: C.textMut,
              marginBottom: 6,
              fontFamily: "'Courier New',monospace",
            }}
          >
            <span>{running || elapsed > 0 ? `T+${formatDuration(Math.round(elapsed))}` : '待启动'}</span>
            <span>总时长 {formatDuration(scenario.duration)}</span>
          </div>
          <div
            style={{
              height: 8,
              background: `${C.border}80`,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${sevC}80, ${sevC})`,
                boxShadow: `0 0 10px ${sevC}66`,
                transition: 'width .15s linear',
              }}
            />
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {scenario.metrics.map((m, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: `${m.color}08`,
                border: `1px solid ${m.color}22`,
                borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 10, color: C.textMut, marginBottom: 4 }}>{m.k}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: m.color,
                  fontFamily: "'Courier New',monospace",
                }}
              >
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="系统响应时间线" extra="MILP + RL 自动决策序列">
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          {/* 竖线 */}
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 8,
              bottom: 8,
              width: 1.5,
              background: `${C.border}`,
            }}
          />
          {scenario.steps.map((step, i) => {
            const reached = elapsed >= step.offset;
            return (
              <div key={i} style={{ position: 'relative', paddingBottom: 18 }}>
                {/* 节点 */}
                <div
                  style={{
                    position: 'absolute',
                    left: -22,
                    top: 2,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: reached ? step.color : C.bg,
                    border: `2px solid ${reached ? step.color : C.border}`,
                    boxShadow: reached ? `0 0 8px ${step.color}` : 'none',
                    transition: 'all .25s',
                    zIndex: 1,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'Courier New',monospace",
                      color: reached ? step.color : C.textMut,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: 9, color: C.textMut, fontFamily: "'Courier New',monospace" }}>
                    Δ {formatDuration(step.offset)}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: reached ? C.text : C.textSec,
                    lineHeight: 1.6,
                    transition: 'color .25s',
                  }}
                >
                  {step.detail}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

const InfoBlock: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      padding: '12px 14px',
      background: `${color}08`,
      border: `1px solid ${color}22`,
      borderRadius: 10,
    }}
  >
    <div style={{ fontSize: 10, color: C.textMut, marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55 }}>{value}</div>
  </div>
);

export default ExtremeScenariosPage;
