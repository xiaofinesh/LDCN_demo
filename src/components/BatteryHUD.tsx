import React from 'react';
import { C } from '../constants/colors';
import { SC, SL } from '../constants/status';
import { PLATFORMS } from '../data/platforms';
import type { Battery } from '../types';

interface BatteryHUDProps {
  b: Battery;
  onClick?: () => void;
  size?: number;
}

const BatteryHUD: React.FC<BatteryHUDProps> = ({ b, onClick, size = 200 }) => {
  const sc = SC[b.st];
  const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
  const charging = b.power > 0;
  const discharging = b.power < 0;
  const platform = PLATFORMS.find((p) => p.id === b.platformId);

  // SVG 参数
  const VB = 200;
  const cx = 100;
  const cy = 100;
  const R = 72;
  const strokeW = 7;
  const circumference = 2 * Math.PI * R;
  const arcLen = (b.soc / 100) * circumference;

  // 刻度：每 10% 一个小 tick
  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 2 * Math.PI - Math.PI / 2;
    const long = i % 4 === 0;
    const r1 = R - strokeW - 2;
    const r2 = r1 - (long ? 6 : 3);
    const x1 = cx + r1 * Math.cos(angle);
    const y1 = cy + r1 * Math.sin(angle);
    const x2 = cx + r2 * Math.cos(angle);
    const y2 = cy + r2 * Math.sin(angle);
    return { x1, y1, x2, y2, long };
  });

  const gradId = `hud-grad-${b.id}`;
  const glowId = `hud-glow-${b.id}`;

  return (
    <div
      onClick={onClick}
      style={{
        background: `linear-gradient(180deg, ${C.bgCard} 0%, ${C.bg} 100%)`,
        border: `1px solid ${sc}2a`,
        borderRadius: 14,
        padding: 14,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color .25s, transform .25s',
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}88`;
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}2a`;
      }}
    >
      {/* 左上角标签 */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 12,
          fontSize: 9,
          color: C.textMut,
          fontFamily: "'Courier New',monospace",
          letterSpacing: 1.5,
        }}
      >
        {platform?.name.replace('钻井平台 ', 'P-') || '—'}
      </div>
      {/* 右上角 SOH */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          fontSize: 9,
          color: C.textMut,
          fontFamily: "'Courier New',monospace",
          letterSpacing: 1,
        }}
      >
        SOH {b.soh}%
      </div>

      <svg viewBox={`0 0 ${VB} ${VB}`} style={{ width: '100%', height: size * 0.82, display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={socC} stopOpacity="1" />
            <stop offset="100%" stopColor={socC} stopOpacity="0.35" />
          </linearGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* 内圈刻度 */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.long ? C.textMut : C.border}
            strokeWidth={t.long ? 1 : 0.6}
            opacity={t.long ? 0.7 : 0.5}
          />
        ))}

        {/* 背景圆环 */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={`${C.border}dd`} strokeWidth={strokeW} />

        {/* SOC 圆环（发光） */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 6px ${socC})`, transition: 'stroke-dasharray .6s' }}
        />

        {/* 电池状态端点 */}
        {b.soc > 0 && (
          <circle
            cx={cx + R * Math.cos(-Math.PI / 2 + (b.soc / 100) * 2 * Math.PI)}
            cy={cy + R * Math.sin(-Math.PI / 2 + (b.soc / 100) * 2 * Math.PI)}
            r={4.5}
            fill={socC}
            style={{ filter: `drop-shadow(0 0 6px ${socC})` }}
          />
        )}

        {/* 中心 SOC 大字 */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={38}
          fontWeight={800}
          fill={socC}
          fontFamily="'Courier New', monospace"
        >
          {Math.round(b.soc)}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize={10}
          fill={C.textMut}
          fontFamily="'Courier New', monospace"
          letterSpacing="2"
        >
          % SOC
        </text>

        {/* 功率与方向 */}
        <g>
          {/* 方向三角 */}
          {charging && (
            <g transform={`translate(${cx - 40}, ${cy + 28})`}>
              <path d="M 0 4 L 6 -4 L 12 4 Z" fill={C.cyan} style={{ filter: `drop-shadow(0 0 4px ${C.cyan})` }}>
                <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          {discharging && (
            <g transform={`translate(${cx - 40}, ${cy + 24})`}>
              <path d="M 0 -4 L 6 4 L 12 -4 Z" fill={C.accent} style={{ filter: `drop-shadow(0 0 4px ${C.accent})` }}>
                <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          {!charging && !discharging && (
            <g transform={`translate(${cx - 40}, ${cy + 26})`}>
              <rect x={0} y={-2} width={12} height={4} rx={2} fill={C.textMut} opacity="0.6" />
            </g>
          )}
          <text
            x={cx - 20}
            y={cy + 32}
            textAnchor="start"
            fontSize={14}
            fontWeight={700}
            fill={charging ? C.cyan : discharging ? C.accent : C.textSec}
            fontFamily="'Courier New', monospace"
          >
            {Math.abs(Math.round(b.power)).toLocaleString()}
          </text>
          <text
            x={cx + 30}
            y={cy + 32}
            textAnchor="start"
            fontSize={9}
            fill={C.textMut}
            fontFamily="'Courier New', monospace"
            letterSpacing="1"
          >
            kW
          </text>
        </g>
      </svg>

      {/* 底部：名称 + 状态 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: C.text,
            fontFamily: "'Courier New', monospace",
            letterSpacing: 2,
          }}
        >
          {b.name}
        </div>
        <div
          style={{
            fontSize: 10,
            padding: '2px 9px',
            borderRadius: 10,
            background: `${sc}18`,
            color: sc,
            border: `1px solid ${sc}30`,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {SL[b.st]}
        </div>
      </div>
    </div>
  );
};

export default BatteryHUD;
