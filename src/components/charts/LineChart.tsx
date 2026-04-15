import React from 'react';
import { C } from '../../constants/colors';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

interface LineChartProps {
  series: LineSeries[];
  labels: string[];
  height?: number;
  unit?: string;
  /** 是否显示面积填充 */
  area?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({ series, labels, height = 220, unit = '', area = true }) => {
  const W = 800;
  const H = height;
  const padL = 48;
  const padR = 18;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allVals = series.flatMap((s) => s.values);
  const maxY = Math.ceil(Math.max(...allVals) / 1000) * 1000 || 1;
  const minY = 0;

  const xAt = (i: number) => padL + (i / Math.max(labels.length - 1, 1)) * innerW;
  const yAt = (v: number) => padT + (1 - (v - minY) / (maxY - minY)) * innerH;

  const ticks = 5;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => minY + ((maxY - minY) * i) / ticks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      {/* Y grid */}
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={yAt(v)} x2={W - padR} y2={yAt(v)} stroke={C.border} strokeWidth={0.5} opacity={0.5} />
          <text x={padL - 6} y={yAt(v) + 3} textAnchor="end" fontSize={9} fill={C.textMut} fontFamily="'Courier New',monospace">
            {v.toLocaleString()}
            {unit}
          </text>
        </g>
      ))}

      {/* X labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={xAt(i)}
          y={H - 8}
          textAnchor="middle"
          fontSize={9}
          fill={C.textMut}
          fontFamily="'Courier New',monospace"
        >
          {i % Math.ceil(labels.length / 10) === 0 ? l : ''}
        </text>
      ))}

      {/* Series */}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ');
        const areaPath = `M ${xAt(0)},${yAt(minY)} L ${s.values
          .map((v, i) => `${xAt(i)},${yAt(v)}`)
          .join(' L ')} L ${xAt(s.values.length - 1)},${yAt(minY)} Z`;
        return (
          <g key={si}>
            {area && (
              <path
                d={areaPath}
                fill={s.color}
                opacity={0.1}
              />
            )}
            <polyline
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 4px ${s.color}88)` }}
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={xAt(i)}
                cy={yAt(v)}
                r={2.5}
                fill={C.bgCard}
                stroke={s.color}
                strokeWidth={1.4}
              />
            ))}
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${padL}, 4)`}>
        {series.map((s, i) => (
          <g key={s.name} transform={`translate(${i * 120}, 0)`}>
            <rect width={10} height={3} rx={1.5} y={6} fill={s.color} />
            <text x={16} y={10} fontSize={10} fill={C.textSec} fontFamily="sans-serif">
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

export default LineChart;
