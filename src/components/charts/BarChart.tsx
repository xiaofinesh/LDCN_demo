import React from 'react';
import { C } from '../../constants/colors';

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  items: BarItem[];
  unit?: string;
  height?: number;
  /** 是否水平 */
  horizontal?: boolean;
  defaultColor?: string;
  minValue?: number;
  maxValue?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  items,
  unit = '',
  height = 220,
  horizontal = false,
  defaultColor,
  minValue,
  maxValue,
}) => {
  const vals = items.map((i) => i.value);
  const min = minValue ?? Math.min(0, ...vals);
  const max = maxValue ?? Math.max(...vals);
  const range = max - min || 1;
  const color = defaultColor || C.accent;

  if (horizontal) {
    const barH = 22;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => {
          const pct = ((it.value - min) / range) * 100;
          const cc = it.color || color;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 56,
                  fontSize: 11,
                  color: C.textSec,
                  fontFamily: "'Courier New',monospace",
                  textAlign: 'right',
                  fontWeight: 600,
                }}
              >
                {it.label}
              </div>
              <div style={{ flex: 1, height: barH, background: `${C.border}40`, borderRadius: 5, position: 'relative', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${cc}80, ${cc})`,
                    boxShadow: `0 0 10px ${cc}40`,
                    transition: 'width .6s ease',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    fontFamily: "'Courier New',monospace",
                    color: C.text,
                    fontWeight: 700,
                  }}
                >
                  {it.value.toLocaleString()}
                  {unit}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // vertical
  const W = 800;
  const H = height;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const gap = 6;
  const barW = (innerW - gap * (items.length - 1)) / items.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      {/* Y axis */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = padT + (1 - f) * innerH;
        const v = min + range * f;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.border} strokeWidth={0.5} opacity={0.5} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill={C.textMut} fontFamily="'Courier New',monospace">
              {Math.round(v)}
            </text>
          </g>
        );
      })}

      {items.map((it, i) => {
        const cc = it.color || color;
        const pct = (it.value - min) / range;
        const x = padL + i * (barW + gap);
        const h = pct * innerH;
        const y = padT + innerH - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              fill={`url(#barg-${i})`}
              rx={3}
              style={{ filter: `drop-shadow(0 2px 4px ${cc}40)` }}
            />
            <defs>
              <linearGradient id={`barg-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cc} stopOpacity="0.9" />
                <stop offset="100%" stopColor={cc} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize={9}
              fill={cc}
              fontFamily="'Courier New',monospace"
              fontWeight={700}
            >
              {it.value}
              {unit}
            </text>
            <text
              x={x + barW / 2}
              y={H - 10}
              textAnchor="middle"
              fontSize={10}
              fill={C.textMut}
              fontFamily="'Courier New',monospace"
            >
              {it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default BarChart;
