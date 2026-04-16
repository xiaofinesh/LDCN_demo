import React from 'react';
import { C } from '../constants/colors';
import { SC, SL } from '../constants/status';
import { PLATFORMS, STATIONS } from '../data/platforms';
import { SCENARIOS, severityColor } from '../data/scenarios';
import type { Scenario } from '../data/scenarios';
import type { Battery } from '../types';

interface MapViewProps {
  batteries: Battery[];
  simHour: number;
  /** 当前激活的场景 id（null = 正常态） */
  activeScenarioId?: string | null;
  /** 场景演练进度 0..1 */
  scenarioProgress?: number;
  /** 点击场景热点 */
  onScenarioClick?: (id: string) => void;
}

/* ── 电池 HUD 半径（SVG 坐标系） ── */
const HR = 28;
const STROKE_W = 4;
const CIRC = 2 * Math.PI * HR;

const MapView: React.FC<MapViewProps> = ({ batteries, simHour, activeScenarioId, onScenarioClick }) => {
  const activeScenario: Scenario | undefined = activeScenarioId
    ? SCENARIOS.find((s) => s.id === activeScenarioId)
    : undefined;
  const affectedBats = new Set(activeScenario?.affectedBatteries ?? []);
  const affectedPlatform = activeScenario?.affectedPlatform;
  const sevC = activeScenario ? severityColor(activeScenario.severity) : C.red;
  const centralStation = STATIONS[0];

  const platformPos = (platformId: number) => {
    const p = PLATFORMS.find((pl) => pl.id === platformId) || PLATFORMS[0];
    return { x: p.x, y: p.y };
  };

  /* ── 电池定位逻辑 ── */
  const pos = (b: Battery): { x: number; y: number } => {
    const pl = platformPos(b.platformId);
    // 围绕平台按索引偏移
    const idx = batteries.filter((bb) => bb.platformId === b.platformId).indexOf(b);
    const total = batteries.filter((bb) => bb.platformId === b.platformId).length;
    const spread = 58;
    const startX = -(total - 1) * spread * 0.5;
    const dx = startX + idx * spread;

    if (b.st === 'supplying' || b.st === 'standby' || b.st === 'swapping')
      return { x: pl.x + dx, y: pl.y + 90 };
    if (b.st === 'charging') {
      // 充电站附近
      const ci = batteries.filter((bb) => bb.st === 'charging').indexOf(b);
      return { x: centralStation.x - 40 + ci * 60, y: centralStation.y - 70 };
    }
    if (b.st === 'to_station') {
      const p = b.tp || 0.5;
      return {
        x: pl.x + (centralStation.x - pl.x) * p,
        y: pl.y + (centralStation.y - pl.y) * p - 10,
      };
    }
    if (b.st === 'to_platform') {
      const p = b.tp || 0.5;
      return {
        x: centralStation.x + (pl.x - centralStation.x) * p,
        y: centralStation.y + (pl.y - centralStation.y) * p - 10,
      };
    }
    return { x: 340, y: 260 };
  };

  return (
    <svg viewBox="0 0 760 540" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="rG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.5" />
          <stop offset="50%" stopColor={C.blue} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.5" />
        </linearGradient>
        <filter id="gl">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ds">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.12" /><stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.12" /><stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── 网格 ── */}
      {Array.from({ length: 20 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={540} stroke={C.border} strokeWidth={0.3} opacity={0.35} />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={760} y2={i * 40} stroke={C.border} strokeWidth={0.3} opacity={0.35} />
      ))}
      <text x={738} y={20} fill={C.textMut} fontSize="9" fontFamily="sans-serif" textAnchor="end" opacity="0.5">
        河北省 · 沧州 / 保定交界
      </text>

      {/* ── 运输路径 ── */}
      {PLATFORMS.map((p) => (
        <path
          key={`r${p.id}`}
          d={`M${p.x},${p.y + 42} Q${(p.x + centralStation.x) / 2 - 40},${(p.y + centralStation.y) / 2} ${centralStation.x},${centralStation.y - 42}`}
          stroke="url(#rG)" strokeWidth="1.8" fill="none" strokeDasharray="5,7" opacity="0.55"
        >
          <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite" />
        </path>
      ))}

      {/* ── 充电站 ── */}
      {STATIONS.map((s) => (
        <g key={`s${s.id}`}>
          <circle cx={s.x} cy={s.y} r={80} fill="url(#sglow)" />
          <circle cx={s.x} cy={s.y} r={52} fill="none" stroke={C.blue} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${s.x} ${s.y}`} to={`-360 ${s.x} ${s.y}`} dur="25s" repeatCount="indefinite" />
          </circle>
          <rect x={s.x - 52} y={s.y - 28} width={104} height={56} rx={14} fill={C.bgCard} stroke={C.blue} strokeWidth="1" filter="url(#ds)" opacity="0.95" />
          <rect x={s.x - 52} y={s.y - 28} width={104} height={2} rx={1} fill={C.blue} opacity="0.4" />
          <circle cx={s.x - 32} cy={s.y - 8} r={3.5} fill={C.blue}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x={s.x - 20} y={s.y - 4} fill={C.blue} fontSize="13" fontWeight="700" fontFamily="sans-serif">{s.name}</text>
          <text x={s.x} y={s.y + 12} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">{s.location}</text>
          <text x={s.x} y={s.y + 24} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="sans-serif">{s.voltage} · {s.capacity.toLocaleString()}kW</text>
        </g>
      ))}

      {/* ── 钻井平台 ── */}
      {PLATFORMS.map((p) => {
        const load = Math.round(p.baseLoad + Math.sin(simHour * 1.3 + p.id) * 90);
        const hit = affectedPlatform === p.id;
        const strokeC = hit ? sevC : C.accent;
        return (
          <g key={`p${p.id}`}>
            <circle cx={p.x} cy={p.y} r={90} fill="url(#pglow)" />
            {/* 受影响时脉冲警示环 */}
            {hit && (
              <circle cx={p.x} cy={p.y} r={68} fill="none" stroke={sevC} strokeWidth="2" opacity="0.5" strokeDasharray="6 4">
                <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1s" repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={p.x} cy={p.y} r={58} fill="none" stroke={strokeC} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="30s" repeatCount="indefinite" />
            </circle>
            <rect x={p.x - 58} y={p.y - 30} width={116} height={60} rx={14} fill={C.bgCard} stroke={strokeC} strokeWidth={hit ? 1.6 : 1} filter="url(#ds)" opacity="0.95" />
            <rect x={p.x - 58} y={p.y - 30} width={116} height={2} rx={1} fill={strokeC} opacity={hit ? 0.7 : 0.4} />
            <circle cx={p.x - 38} cy={p.y - 10} r={3.5} fill={strokeC}>
              <animate attributeName="opacity" values="1;0.3;1" dur={hit ? '0.6s' : '2s'} repeatCount="indefinite" />
            </circle>
            <text x={p.x - 28} y={p.y - 6} fill={strokeC} fontSize="13" fontWeight="700" fontFamily="sans-serif">{p.name}</text>
            <text x={p.x} y={p.y + 10} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">{p.location}</text>
            <text x={p.x} y={p.y + 22} textAnchor="middle" fill={hit ? sevC : C.textMut} fontSize="9" fontFamily="'Courier New',monospace"
              fontWeight={hit ? 700 : 400}>
              {load} kW{hit ? ' ⚠' : ''}
            </text>
          </g>
        );
      })}

      {/* ── 电池 HUD 节点 ── */}
      {batteries.map((b) => {
        const p = pos(b);
        const isAffected = affectedBats.has(b.id);
        const sc = isAffected ? sevC : SC[b.st];
        const socC = isAffected ? sevC : (b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red);
        const moving = b.st === 'to_station' || b.st === 'to_platform';
        const charging = b.power > 0;
        const discharging = b.power < 0;
        const arcLen = (b.soc / 100) * CIRC;
        const gradId = `hm-${b.id}`;

        /* 8 个刻度线（每 45°） */
        const tickCount = 12;
        const tickR1 = HR - STROKE_W - 1.5;
        const tickR2 = tickR1 - 4;
        const ticks = Array.from({ length: tickCount }, (_, i) => {
          const angle = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
          return {
            x1: p.x + tickR1 * Math.cos(angle),
            y1: p.y + tickR1 * Math.sin(angle),
            x2: p.x + tickR2 * Math.cos(angle),
            y2: p.y + tickR2 * Math.sin(angle),
            major: i % 3 === 0,
          };
        });

        /* SOC 环终点 */
        const endAngle = -Math.PI / 2 + (b.soc / 100) * 2 * Math.PI;
        const endX = p.x + HR * Math.cos(endAngle);
        const endY = p.y + HR * Math.sin(endAngle);

        return (
          <g key={b.id}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={socC} />
                <stop offset="100%" stopColor={socC} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* 受影响告警脉冲 */}
            {isAffected && (
              <circle cx={p.x} cy={p.y} r={HR + 10} fill="none" stroke={sevC} strokeWidth="2" opacity="0.6">
                <animate attributeName="r" values={`${HR + 10};${HR + 20};${HR + 10}`} dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* 运输中旋转环 */}
            {moving && (
              <circle cx={p.x} cy={p.y} r={HR + 6} fill="none" stroke={C.amber} strokeWidth="0.8" opacity="0.4" strokeDasharray="4,5">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )}

            {/* 外光晕 */}
            <circle cx={p.x} cy={p.y} r={HR + 12} fill="none" opacity="0">
              {(charging || discharging) && (
                <animate attributeName="opacity" values="0;0.06;0" dur="2s" repeatCount="indefinite" />
              )}
            </circle>

            {/* 刻度线 */}
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.major ? C.textMut : C.border} strokeWidth={t.major ? 0.8 : 0.5}
                opacity={t.major ? 0.65 : 0.4} />
            ))}

            {/* 背景圆 */}
            <circle cx={p.x} cy={p.y} r={HR} fill={C.bg} stroke={`${C.border}`} strokeWidth={STROKE_W} opacity="0.9" />

            {/* SOC 弧 */}
            <circle
              cx={p.x} cy={p.y} r={HR}
              fill="none" stroke={`url(#${gradId})`} strokeWidth={STROKE_W} strokeLinecap="round"
              strokeDasharray={`${arcLen} ${CIRC}`}
              transform={`rotate(-90 ${p.x} ${p.y})`}
              style={{ filter: `drop-shadow(0 0 5px ${socC}88)`, transition: 'stroke-dasharray .5s' }}
            />

            {/* SOC 端点 */}
            {b.soc > 2 && (
              <circle cx={endX} cy={endY} r={3} fill={socC}
                style={{ filter: `drop-shadow(0 0 4px ${socC})` }} />
            )}

            {/* 中心 SOC */}
            <text x={p.x} y={p.y - 1} textAnchor="middle" fontSize="15" fontWeight="800"
              fill={socC} fontFamily="'Courier New',monospace">
              {Math.round(b.soc)}
            </text>
            <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize="7" fill={C.textMut}
              fontFamily="'Courier New',monospace" letterSpacing="1.5">
              %
            </text>

            {/* 功率指示（圆外下方） */}
            {(charging || discharging) && (
              <g>
                {charging ? (
                  <polygon points={`${p.x - 4},${p.y + HR + 11} ${p.x},${p.y + HR + 5} ${p.x + 4},${p.y + HR + 11}`}
                    fill={C.cyan} style={{ filter: `drop-shadow(0 0 3px ${C.cyan})` }}>
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                  </polygon>
                ) : (
                  <polygon points={`${p.x - 4},${p.y + HR + 5} ${p.x},${p.y + HR + 11} ${p.x + 4},${p.y + HR + 5}`}
                    fill={C.accent} style={{ filter: `drop-shadow(0 0 3px ${C.accent})` }}>
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                  </polygon>
                )}
                <text x={p.x} y={p.y + HR + 22} textAnchor="middle" fontSize="8"
                  fontWeight="700" fontFamily="'Courier New',monospace"
                  fill={charging ? C.cyan : C.accent}>
                  {Math.abs(Math.round(b.power))}kW
                </text>
              </g>
            )}

            {/* 名称 */}
            <text x={p.x} y={p.y + HR + (charging || discharging ? 34 : 16)}
              textAnchor="middle" fill={sc} fontSize="10" fontWeight="800"
              fontFamily="'Courier New',monospace" letterSpacing="1">
              {b.name}
            </text>
            {/* 状态 */}
            <text x={p.x} y={p.y + HR + (charging || discharging ? 44 : 26)}
              textAnchor="middle" fill={C.textMut} fontSize="8" fontFamily="sans-serif">
              {SL[b.st]}
            </text>
          </g>
        );
      })}
      {/* ── 场景热点图标 ── */}
      {SCENARIOS.map((s) => {
        const sc = severityColor(s.severity);
        const active = s.id === activeScenarioId;
        const R2 = active ? 16 : 13;
        return (
          <g
            key={`sc-${s.id}`}
            style={{ cursor: 'pointer' }}
            onClick={() => onScenarioClick?.(s.id)}
          >
            {/* 外圈脉冲 */}
            <circle cx={s.mapX} cy={s.mapY} r={R2 + 6} fill="none" stroke={sc} strokeWidth={active ? 1.5 : 0.8} opacity={0.3}>
              <animate attributeName="r" values={`${R2 + 4};${R2 + 12};${R2 + 4}`} dur={active ? '1.2s' : '3s'} repeatCount="indefinite" />
              <animate attributeName="opacity" values={active ? '0.6;0.1;0.6' : '0.3;0.05;0.3'} dur={active ? '1.2s' : '3s'} repeatCount="indefinite" />
            </circle>

            {/* 背景圆 */}
            <circle cx={s.mapX} cy={s.mapY} r={R2} fill={C.bg} stroke={sc}
              strokeWidth={active ? 2.5 : 1.5} opacity={0.95}
              style={{ filter: active ? `drop-shadow(0 0 10px ${sc})` : `drop-shadow(0 0 4px ${sc}88)` }}
            />

            {/* 图标 */}
            <text x={s.mapX} y={s.mapY + (active ? 5 : 4)} textAnchor="middle"
              fontSize={active ? 14 : 11} fill={sc} fontWeight="700">
              {s.icon}
            </text>

            {/* 激活时显示标题 */}
            {active && (
              <g>
                <rect x={s.mapX - 62} y={s.mapY - R2 - 22} width={124} height={18} rx={9}
                  fill={C.bg} stroke={sc} strokeWidth="1" opacity="0.92" />
                <text x={s.mapX} y={s.mapY - R2 - 10} textAnchor="middle"
                  fontSize="9" fontWeight="700" fill={sc} fontFamily="sans-serif">
                  {s.title}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default MapView;
