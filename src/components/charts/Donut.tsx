import React from 'react';
import { C } from '../../constants/colors';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

const Donut: React.FC<DonutProps> = ({
  slices,
  size = 180,
  thickness = 24,
  centerLabel,
  centerValue,
}) => {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const R = size / 2;
  const r = R - thickness / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((s) => {
    const frac = s.value / total;
    const dash = frac * circ;
    const arc = { ...s, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={R} cy={R} r={r} fill="none" stroke={`${C.border}80`} strokeWidth={thickness} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={R}
            cy={R}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${a.dash} ${circ}`}
            strokeDashoffset={-a.offset}
            transform={`rotate(-90 ${R} ${R})`}
            style={{ filter: `drop-shadow(0 0 4px ${a.color}66)`, transition: 'stroke-dasharray .6s' }}
          />
        ))}
        {centerValue && (
          <>
            <text
              x={R}
              y={R - 2}
              textAnchor="middle"
              fontSize={18}
              fontWeight={800}
              fill={C.text}
              fontFamily="'Courier New',monospace"
            >
              {centerValue}
            </text>
            {centerLabel && (
              <text x={R} y={R + 16} textAnchor="middle" fontSize={10} fill={C.textMut}>
                {centerLabel}
              </text>
            )}
          </>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {slices.map((s) => {
          const pct = ((s.value / total) * 100).toFixed(1);
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <div style={{ color: C.textSec, flex: 1 }}>{s.label}</div>
              <div style={{ color: C.text, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Donut;
