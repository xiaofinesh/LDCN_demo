import React from 'react';
import { C } from '../constants/colors';
import { DAILY_ENERGY_HISTORY, HISTORY_STATS } from '../data/history';

interface Props {
  /** 今日平均单平台预计用电量（kWh），用于与 75 天基线对比 */
  todayPerPlatform?: number;
  height?: number;
}

const EnergySparkline: React.FC<Props> = ({ todayPerPlatform, height = 88 }) => {
  const W = 640;
  const H = height;
  const padL = 6;
  const padR = 6;
  const padT = 10;
  const padB = 18;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const max = HISTORY_STATS.max;
  const xAt = (i: number) => padL + (i / (DAILY_ENERGY_HISTORY.length - 1)) * innerW;
  const yAt = (v: number) => padT + (1 - v / max) * innerH;
  const mean = HISTORY_STATS.mean;
  const median = HISTORY_STATS.median;

  const pts = DAILY_ENERGY_HISTORY.map((d, i) => `${xAt(i)},${yAt(d.kwh)}`).join(' ');
  const area = `M ${xAt(0)},${yAt(0)} L ${DAILY_ENERGY_HISTORY.map((d, i) => `${xAt(i)},${yAt(d.kwh)}`).join(' L ')} L ${xAt(DAILY_ENERGY_HISTORY.length - 1)},${yAt(0)} Z`;

  const maxDay = DAILY_ENERGY_HISTORY.find((d) => d.day === HISTORY_STATS.maxDay);
  const minDay = DAILY_ENERGY_HISTORY.find((d) => d.day === HISTORY_STATS.minDay);
  const maxI = maxDay ? DAILY_ENERGY_HISTORY.indexOf(maxDay) : 0;
  const minI = minDay ? DAILY_ENERGY_HISTORY.indexOf(minDay) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id="spark-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 均值 / 中位数线 */}
      <line x1={padL} y1={yAt(mean)} x2={W - padR} y2={yAt(mean)} stroke={C.accent} strokeWidth={0.6} strokeDasharray="3 4" opacity={0.6} />
      <text x={W - padR - 2} y={yAt(mean) - 3} textAnchor="end" fontSize={9} fill={C.accent} fontFamily="'Courier New',monospace">
        均值 {mean.toLocaleString()}
      </text>
      <line x1={padL} y1={yAt(median)} x2={W - padR} y2={yAt(median)} stroke={C.purple} strokeWidth={0.6} strokeDasharray="2 3" opacity={0.45} />

      {/* 面积 */}
      <path d={area} fill="url(#spark-area)" />
      {/* 折线 */}
      <polyline points={pts} fill="none" stroke={C.blue} strokeWidth={1.6} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${C.blue}88)` }} />

      {/* 极值点 */}
      {maxDay && (
        <g>
          <circle cx={xAt(maxI)} cy={yAt(maxDay.kwh)} r={3.2} fill={C.red} style={{ filter: `drop-shadow(0 0 6px ${C.red})` }} />
          <text x={xAt(maxI)} y={yAt(maxDay.kwh) - 6} textAnchor="middle" fontSize={9} fill={C.red} fontFamily="'Courier New',monospace" fontWeight={700}>
            max {maxDay.kwh.toLocaleString()}
          </text>
        </g>
      )}
      {minDay && (
        <g>
          <circle cx={xAt(minI)} cy={yAt(minDay.kwh)} r={3} fill={C.amber} style={{ filter: `drop-shadow(0 0 5px ${C.amber})` }} />
          <text x={xAt(minI)} y={yAt(minDay.kwh) + 10} textAnchor="middle" fontSize={9} fill={C.amber} fontFamily="'Courier New',monospace" fontWeight={700}>
            min {minDay.kwh.toLocaleString()}
          </text>
        </g>
      )}

      {/* 今日对照线 */}
      {todayPerPlatform !== undefined && todayPerPlatform > 0 && (
        <g>
          <line x1={padL} y1={yAt(todayPerPlatform)} x2={W - padR} y2={yAt(todayPerPlatform)} stroke={C.cyan} strokeWidth={1} strokeDasharray="5 4" opacity={0.7} />
          <text x={padL + 4} y={yAt(todayPerPlatform) - 3} fontSize={9} fill={C.cyan} fontFamily="'Courier New',monospace" fontWeight={700}>
            今日预计 {Math.round(todayPerPlatform).toLocaleString()}
          </text>
        </g>
      )}

      {/* X 轴标注 */}
      <text x={padL} y={H - 4} fontSize={9} fill={C.textMut} fontFamily="'Courier New',monospace">
        D-1
      </text>
      <text x={W - padR} y={H - 4} textAnchor="end" fontSize={9} fill={C.textMut} fontFamily="'Courier New',monospace">
        D-75
      </text>
    </svg>
  );
};

export default EnergySparkline;
