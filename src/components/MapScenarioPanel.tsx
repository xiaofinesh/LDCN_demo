import React from 'react';
import { C } from '../constants/colors';
import { SCENARIOS, severityColor, severityLabel } from '../data/scenarios';
import type { Scenario } from '../data/scenarios';

interface Props {
  activeId: string | null;
  progress: number; // 0..1
  onSelect: (id: string) => void;
  onClose: () => void;
  running: boolean;
  onToggle: () => void;
}

const MapScenarioPanel: React.FC<Props> = ({ activeId, progress, onSelect, onClose, running, onToggle }) => {
  const active = activeId ? SCENARIOS.find((s) => s.id === activeId) : null;

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 6 }}>
      {/* 场景选择条 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: active ? 12 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.textMut, fontWeight: 600, letterSpacing: 1.5, marginRight: 6 }}>极端场景</span>
        {SCENARIOS.map((s) => {
          const sc = severityColor(s.severity);
          const sel = s.id === activeId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 7,
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                background: sel ? `${sc}18` : 'transparent',
                color: sel ? sc : C.textSec,
                border: `1px solid ${sel ? sc : C.border}`,
                transition: 'all .15s',
              }}
            >
              <span style={{ fontSize: 11 }}>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          );
        })}
        {active && (
          <button onClick={onClose} style={closeBtnStyle}>✕ 关闭</button>
        )}
      </div>

      {/* 激活场景：时间线 + KPI */}
      {active && <ActivePanel scenario={active} progress={progress} running={running} onToggle={onToggle} />}
    </div>
  );
};

const ActivePanel: React.FC<{ scenario: Scenario; progress: number; running: boolean; onToggle: () => void }> = ({
  scenario, progress, running, onToggle,
}) => {
  const sc = severityColor(scenario.severity);
  const elapsed = progress * scenario.duration;

  // 当前到达的步骤
  const activeStepIdx = (() => {
    let idx = 0;
    for (let i = scenario.steps.length - 1; i >= 0; i--) {
      if (elapsed >= scenario.steps[i].offset) { idx = i; break; }
    }
    return idx;
  })();

  const maxOffset = Math.max(scenario.steps[scenario.steps.length - 1].offset, 1);
  const step = scenario.steps[activeStepIdx];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 280px) minmax(0, 1fr) minmax(0, 200px)', gap: 18 }}>
      {/* 左：触发 + 按钮 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 9, padding: '2px 7px', borderRadius: 10,
            background: `${sc}20`, color: sc, border: `1px solid ${sc}40`, fontWeight: 700,
          }}>
            {severityLabel(scenario.severity)} · {scenario.tag}
          </span>
          <span style={{ fontSize: 9, color: C.textMut, fontFamily: "'Courier New',monospace" }}>
            {fmtDuration(scenario.duration)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6, marginBottom: 8 }}>
          <span style={{ color: sc, fontWeight: 700 }}>触发：</span>{scenario.trigger}
        </div>
        <button onClick={onToggle} style={{
          background: running ? `${C.red}18` : `${C.accent}18`,
          color: running ? C.red : C.accent,
          border: `1px solid ${running ? C.red : C.accent}40`,
          padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>
          {running ? '⏸ 暂停演练' : '▶ 启动演练'}
        </button>
      </div>

      {/* 中：时间线 */}
      <div>
        {/* 水平时间线 */}
        <div style={{ position: 'relative', height: 28, marginBottom: 6 }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 14, height: 2,
            background: C.border, borderRadius: 1,
          }} />
          {/* 已点亮进度 */}
          <div style={{
            position: 'absolute', left: 0, top: 14, height: 2,
            width: `${Math.min(100, (scenario.steps[activeStepIdx].offset / maxOffset) * 100)}%`,
            background: `linear-gradient(90deg, ${C.accent}, ${step.color})`,
            boxShadow: `0 0 6px ${step.color}`,
            borderRadius: 1, transition: 'width .3s',
          }} />
          {scenario.steps.map((s, i) => {
            const pct = (s.offset / maxOffset) * 100;
            const reached = i <= activeStepIdx;
            return (
              <div key={i} style={{
                position: 'absolute', left: `${pct}%`, top: 8, transform: 'translateX(-50%)',
              }}>
                <div style={{
                  width: reached ? 12 : 8, height: reached ? 12 : 8, borderRadius: 6,
                  background: reached ? s.color : C.bg,
                  border: `2px solid ${reached ? s.color : C.border}`,
                  boxShadow: reached ? `0 0 6px ${s.color}` : 'none',
                  transition: 'all .25s',
                }} />
              </div>
            );
          })}
        </div>
        {/* 当前步骤文案 */}
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          <span style={{
            color: step.color, fontWeight: 700, fontFamily: "'Courier New',monospace",
            marginRight: 6, fontSize: 10,
          }}>
            {step.label}
          </span>
          <span style={{ color: C.text }}>{step.detail}</span>
        </div>
        {/* 进度条 */}
        <div style={{
          marginTop: 8, height: 3, background: C.border, borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: `linear-gradient(90deg, ${sc}, ${C.accent})`,
            boxShadow: `0 0 6px ${sc}`, transition: 'width .1s linear',
          }} />
        </div>
      </div>

      {/* 右：KPI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {scenario.metrics.map((m, i) => (
          <div key={i} style={{
            padding: '5px 10px', background: `${m.color}0c`,
            border: `1px solid ${m.color}20`, borderRadius: 7,
          }}>
            <div style={{ fontSize: 9, color: C.textMut }}>{m.k}</div>
            <div style={{
              fontSize: 13, fontWeight: 800, color: m.color,
              fontFamily: "'Courier New',monospace",
            }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const closeBtnStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  border: `1px solid ${C.border}`,
  color: C.textMut,
  padding: '3px 10px',
  borderRadius: 6,
  fontSize: 10,
  cursor: 'pointer',
};

const fmtDuration = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} 分钟`;
  return `${(sec / 3600).toFixed(sec % 3600 === 0 ? 0 : 1)} 小时`;
};

export default MapScenarioPanel;
