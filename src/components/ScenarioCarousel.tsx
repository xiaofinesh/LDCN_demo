import React, { useEffect, useRef, useState } from 'react';
import { C } from '../constants/colors';
import { SCENARIOS, severityColor, severityLabel } from '../data/scenarios';
import type { Scenario } from '../data/scenarios';

interface ScenarioCarouselProps {
  /** 每个场景演示总时长（秒），默认 28s */
  demoSeconds?: number;
}

const ScenarioCarousel: React.FC<ScenarioCarouselProps> = ({ demoSeconds = 28 }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const scenario = SCENARIOS[idx];

  useEffect(() => {
    if (paused) return;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const ratio = (ts - startRef.current) / 1000 / demoSeconds;
      if (ratio >= 1) {
        setProgress(0);
        setIdx((i) => (i + 1) % SCENARIOS.length);
      } else {
        setProgress(ratio);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [idx, paused, demoSeconds]);

  const go = (delta: number) => {
    setIdx((i) => (i + delta + SCENARIOS.length) % SCENARIOS.length);
    setProgress(0);
  };

  const simulatedElapsedSec = progress * scenario.duration;

  // 当前已到达的时间线节点
  const currentStepIdx = [...scenario.steps]
    .reverse()
    .find((s) => simulatedElapsedSec >= s.offset);
  const activeIdx = currentStepIdx ? scenario.steps.indexOf(currentStepIdx) : 0;

  const sevC = severityColor(scenario.severity);

  return (
    <div
      style={{
        position: 'relative',
        background: `linear-gradient(92deg, ${C.bgCard} 0%, ${sevC}06 50%, ${C.bgCard} 100%)`,
        border: `1px solid ${sevC}30`,
        borderRadius: 14,
        padding: '14px 20px 12px',
        overflow: 'hidden',
        marginBottom: 18,
      }}
    >
      {/* 顶部栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: sevC,
            letterSpacing: 2,
            fontWeight: 700,
            padding: '3px 8px',
            background: `${sevC}18`,
            border: `1px solid ${sevC}40`,
            borderRadius: 6,
          }}
        >
          ⚡ 极端场景演练
        </div>
        <div
          style={{
            fontSize: 9,
            color: C.textMut,
            letterSpacing: 1.5,
            fontFamily: "'Courier New',monospace",
          }}
        >
          AUTO / 每 {demoSeconds}s 切换 · {idx + 1} / {SCENARIOS.length}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => go(-1)}
          style={btnStyle(C.textSec)}
          title="上一个场景"
        >
          ◀
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          style={btnStyle(paused ? C.accent : C.textSec)}
          title={paused ? '继续' : '暂停'}
        >
          {paused ? '▶' : '⏸'}
        </button>
        <button
          onClick={() => go(1)}
          style={btnStyle(C.textSec)}
          title="下一个场景"
        >
          ▶
        </button>
      </div>

      {/* 主体：左侧文案 + 右侧时间线 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 360px) minmax(0, 1fr) 180px',
          gap: 22,
          alignItems: 'stretch',
        }}
      >
        {/* 左：标题 + 触发 + 结果 */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 5,
            }}
          >
            <span
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 10,
                background: `${sevC}20`,
                color: sevC,
                border: `1px solid ${sevC}40`,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {severityLabel(scenario.severity)}
            </span>
            <span style={{ fontSize: 10, color: C.textMut, fontWeight: 600 }}>
              · {scenario.tag} · 时长 {fmtDuration(scenario.duration)}
            </span>
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: C.text,
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {scenario.title}
          </div>
          <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.6, marginBottom: 4 }}>
            <span style={{ color: sevC, fontWeight: 700 }}>触发：</span>
            {scenario.trigger}
          </div>
          <div style={{ fontSize: 11, color: C.textMut, lineHeight: 1.6 }}>
            <span style={{ color: C.accent, fontWeight: 700 }}>处置：</span>
            {scenario.outcome}
          </div>
        </div>

        {/* 中：时间线 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 80 }}>
          <Timeline steps={scenario.steps} activeIdx={activeIdx} />
          {scenario.steps[activeIdx] && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: scenario.steps[activeIdx].color,
                fontFamily: "'Courier New',monospace",
                letterSpacing: 0.3,
                lineHeight: 1.5,
              }}
            >
              <span style={{ marginRight: 6, fontWeight: 700 }}>{scenario.steps[activeIdx].label}</span>
              <span style={{ color: C.text }}>{scenario.steps[activeIdx].detail}</span>
            </div>
          )}
        </div>

        {/* 右：KPI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
          {scenario.metrics.map((m, i) => (
            <div
              key={i}
              style={{
                padding: '7px 10px',
                background: `${m.color}0e`,
                border: `1px solid ${m.color}25`,
                borderRadius: 7,
              }}
            >
              <div style={{ fontSize: 9, color: C.textMut, marginBottom: 2 }}>{m.k}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: m.color,
                  fontFamily: "'Courier New',monospace",
                  letterSpacing: 0.5,
                }}
              >
                {m.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部：进度 + 场景指示点 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <div
          style={{
            flex: 1,
            height: 3,
            background: `${C.border}`,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${sevC}, ${C.accent})`,
              boxShadow: `0 0 6px ${sevC}`,
              transition: 'width .12s linear',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {SCENARIOS.map((_, i) => (
            <span
              key={i}
              onClick={() => {
                setIdx(i);
                setProgress(0);
              }}
              style={{
                width: i === idx ? 14 : 5,
                height: 5,
                borderRadius: 3,
                background: i === idx ? sevC : C.border,
                transition: 'width .25s, background .25s',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Timeline: React.FC<{ steps: Scenario['steps']; activeIdx: number }> = ({ steps, activeIdx }) => {
  const maxOffset = Math.max(steps[steps.length - 1].offset, 1);
  return (
    <div style={{ position: 'relative', height: 30 }}>
      {/* 底线 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 15,
          height: 2,
          background: C.border,
          borderRadius: 1,
        }}
      />
      {/* 已点亮部分 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 15,
          height: 2,
          width: `${(steps[activeIdx].offset / maxOffset) * 100}%`,
          background: `linear-gradient(90deg, ${C.accent}, ${steps[activeIdx].color})`,
          boxShadow: `0 0 6px ${steps[activeIdx].color}`,
          borderRadius: 1,
          transition: 'width .4s',
        }}
      />
      {steps.map((s, i) => {
        const pct = (s.offset / maxOffset) * 100;
        const reached = i <= activeIdx;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${pct}%`,
              top: 8,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              style={{
                width: reached ? 14 : 9,
                height: reached ? 14 : 9,
                borderRadius: 7,
                background: reached ? s.color : C.bg,
                border: `2px solid ${reached ? s.color : C.border}`,
                boxShadow: reached ? `0 0 8px ${s.color}` : 'none',
                transition: 'all .3s',
              }}
            />
            {i === activeIdx && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 9,
                  color: s.color,
                  fontFamily: "'Courier New',monospace",
                  fontWeight: 700,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transform: 'translateX(-50%)',
                  marginLeft: 7,
                }}
              >
                {s.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const btnStyle = (color: string): React.CSSProperties => ({
  background: `${color}18`,
  border: `1px solid ${color}40`,
  color,
  width: 28,
  height: 26,
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
});

const fmtDuration = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)} 分钟`;
  return `${(sec / 3600).toFixed(sec % 3600 === 0 ? 0 : 1)} 小时`;
};

export default ScenarioCarousel;
