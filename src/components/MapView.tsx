import React from 'react';
import { C } from '../constants/colors';
import { BNAME, SC, SL } from '../constants/status';
import type { Battery } from '../types';

interface MapViewProps {
  batteries: Battery[];
  simHour: number;
}

const MapView: React.FC<MapViewProps> = ({ batteries, simHour }) => {
  const PX = 520, PY = 100, SX = 145, SY = 315;

  const pos = (b: Battery): { x: number; y: number } => {
    if (b.st === 'supplying' || b.st === 'standby' || b.st === 'swapping')
      return { x: PX - 48 + b.id * 32, y: PY + 78 + b.id * 10 };
    if (b.st === 'charging') return { x: SX - 30 + b.id * 28, y: SY - 58 };
    if (b.st === 'to_station') {
      const p = b.tp || 0.5;
      return { x: PX + (SX - PX) * p, y: PY + (SY - PY) * p - 15 };
    }
    if (b.st === 'to_platform') {
      const p = b.tp || 0.5;
      return { x: SX + (PX - SX) * p, y: SY + (PY - SY) * p - 15 };
    }
    return { x: 335, y: 210 };
  };

  return (
    <svg viewBox="0 0 680 430" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="rG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.5" />
          <stop offset="50%" stopColor={C.blue} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.5" />
        </linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ds"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55" /></filter>
        <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.12" /><stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.12" /><stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle grid */}
      {Array.from({ length: 18 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={430} stroke={C.border} strokeWidth={0.3} opacity={0.4} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={680} y2={i * 40} stroke={C.border} strokeWidth={0.3} opacity={0.4} />
      ))}

      {/* Region text */}
      <text x={658} y={22} fill={C.textMut} fontSize="9" fontFamily="sans-serif" textAnchor="end" opacity="0.5">
        河北省 · 沧州 / 保定交界
      </text>

      {/* Route path */}
      <path
        d={`M${PX},${PY + 42} Q${PX - 80},${(PY + SY) / 2} ${SX},${SY - 42}`}
        stroke="url(#rG)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="5,7"
        opacity="0.6"
      >
        <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite" />
      </path>

      {/* Distance badge */}
      <g transform={`translate(${(PX + SX) / 2 + 35},${(PY + SY) / 2 - 30})`}>
        <rect x="-44" y="-12" width="88" height="24" rx="12" fill={C.bgCard} stroke={C.border} strokeWidth="0.8" opacity="0.9" />
        <text x="0" y="4" textAnchor="middle" fill={C.textMut} fontSize="10" fontFamily="sans-serif">≈ 30–60 km</text>
      </g>

      {/* Platform glow */}
      <circle cx={PX} cy={PY} r={90} fill="url(#pglow)" />
      <circle cx={PX} cy={PY} r={58} fill="none" stroke={C.accent} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${PX} ${PY}`} to={`360 ${PX} ${PY}`} dur="30s" repeatCount="indefinite" />
      </circle>

      {/* Platform box */}
      <rect x={PX - 58} y={PY - 30} width={116} height={60} rx={14} fill={C.bgCard} stroke={C.accent} strokeWidth="1" filter="url(#ds)" opacity="0.95" />
      <rect x={PX - 58} y={PY - 30} width={116} height={2} rx={1} fill={C.accent} opacity="0.4" />
      <circle cx={PX - 38} cy={PY - 10} r={3.5} fill={C.accent}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x={PX - 28} y={PY - 6} fill={C.accent} fontSize="14" fontWeight="700" fontFamily="sans-serif">钻井平台</text>
      <text x={PX} y={PY + 10} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">任丘市北部</text>
      <text x={PX} y={PY + 22} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="'Courier New',monospace">
        {Math.round(471 + Math.sin(simHour * 1.3) * 150)} kW 负荷
      </text>

      {/* Station glow */}
      <circle cx={SX} cy={SY} r={80} fill="url(#sglow)" />
      <circle cx={SX} cy={SY} r={52} fill="none" stroke={C.blue} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
        <animateTransform attributeName="transform" type="rotate" from={`0 ${SX} ${SY}`} to={`-360 ${SX} ${SY}`} dur="25s" repeatCount="indefinite" />
      </circle>

      {/* Station box */}
      <rect x={SX - 52} y={SY - 28} width={104} height={56} rx={14} fill={C.bgCard} stroke={C.blue} strokeWidth="1" filter="url(#ds)" opacity="0.95" />
      <rect x={SX - 52} y={SY - 28} width={104} height={2} rx={1} fill={C.blue} opacity="0.4" />
      <circle cx={SX - 32} cy={SY - 8} r={3.5} fill={C.blue}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <text x={SX - 20} y={SY - 4} fill={C.blue} fontSize="14" fontWeight="700" fontFamily="sans-serif">充电站</text>
      <text x={SX} y={SY + 12} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">河间市</text>
      <text x={SX} y={SY + 24} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="sans-serif">10kV · 1,725kW</text>

      {/* Batteries */}
      {batteries.map((b) => {
        const p = pos(b);
        const sc = SC[b.st];
        const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
        const moving = b.st === 'to_station' || b.st === 'to_platform';
        return (
          <g key={b.id}>
            {/* movement ring */}
            {moving && (
              <circle cx={p.x} cy={p.y + 2} r={24} fill="none" stroke={C.amber} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,4">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y + 2}`} to={`360 ${p.x} ${p.y + 2}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            {/* battery body */}
            <rect x={p.x - 24} y={p.y - 14} width={48} height={28} rx={8} fill={C.bg} stroke={sc} strokeWidth="1.4" filter="url(#gl)" />
            {/* SOC fill */}
            <rect x={p.x - 20} y={p.y - 1} width={Math.max(1, (40 * b.soc) / 100)} height={5} rx={2.5} fill={socC} opacity="0.75">
              {b.st === 'charging' && <animate attributeName="opacity" values="0.75;0.4;0.75" dur="1.5s" repeatCount="indefinite" />}
            </rect>
            {/* terminal */}
            <rect x={p.x + 24} y={p.y - 4} width={4} height={8} rx={2} fill={sc} opacity="0.4" />
            {/* SOC text */}
            <text x={p.x} y={p.y - 5} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="800" fontFamily="'Courier New',monospace">
              {Math.round(b.soc)}%
            </text>
            {/* label */}
            <text x={p.x} y={p.y + 25} textAnchor="middle" fill={sc} fontSize="10.5" fontWeight="800" fontFamily="'Courier New',monospace" letterSpacing="1">
              {BNAME[b.id - 1]}
            </text>
            <text x={p.x} y={p.y + 37} textAnchor="middle" fill={C.textMut} fontSize="8.5" fontFamily="sans-serif">
              {SL[b.st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default MapView;
