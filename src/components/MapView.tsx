import React from 'react';
import { C } from '../constants/colors';
import { SC, SL } from '../constants/status';
import { PLATFORMS, STATIONS } from '../data/platforms';
import type { Battery } from '../types';

interface MapViewProps {
  batteries: Battery[];
  simHour: number;
}

const MapView: React.FC<MapViewProps> = ({ batteries, simHour }) => {
  const centralStation = STATIONS[0];

  const platformPos = (platformId: number) => {
    const p = PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[0];
    return { x: p.x, y: p.y };
  };

  const pos = (b: Battery): { x: number; y: number } => {
    const pl = platformPos(b.platformId);
    const offset = ((b.id - 1) % 3) * 22 - 22;
    if (b.st === 'supplying' || b.st === 'standby' || b.st === 'swapping')
      return { x: pl.x + offset, y: pl.y + 78 + ((b.id - 1) % 3) * 8 };
    if (b.st === 'charging')
      return { x: centralStation.x - 30 + ((b.id - 1) % 3) * 28, y: centralStation.y - 58 };
    if (b.st === 'to_station') {
      const p = b.tp || 0.5;
      return {
        x: pl.x + (centralStation.x - pl.x) * p,
        y: pl.y + (centralStation.y - pl.y) * p - 15,
      };
    }
    if (b.st === 'to_platform') {
      const p = b.tp || 0.5;
      return {
        x: centralStation.x + (pl.x - centralStation.x) * p,
        y: centralStation.y + (pl.y - centralStation.y) * p - 15,
      };
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
        <filter id="gl">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ds">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <radialGradient id="pglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle grid */}
      {Array.from({ length: 18 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={430} stroke={C.border} strokeWidth={0.3} opacity={0.4} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={680} y2={i * 40} stroke={C.border} strokeWidth={0.3} opacity={0.4} />
      ))}

      <text x={658} y={22} fill={C.textMut} fontSize="9" fontFamily="sans-serif" textAnchor="end" opacity="0.5">
        河北省 · 沧州 / 保定交界
      </text>

      {/* Routes: central station -> each platform */}
      {PLATFORMS.map((p) => (
        <path
          key={`r${p.id}`}
          d={`M${p.x},${p.y + 42} Q${(p.x + centralStation.x) / 2 - 40},${(p.y + centralStation.y) / 2} ${centralStation.x},${centralStation.y - 42}`}
          stroke="url(#rG)"
          strokeWidth="1.8"
          fill="none"
          strokeDasharray="5,7"
          opacity="0.55"
        >
          <animate attributeName="stroke-dashoffset" values="0;-24" dur="3s" repeatCount="indefinite" />
        </path>
      ))}

      {/* Stations */}
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
          <text x={s.x - 20} y={s.y - 4} fill={C.blue} fontSize="13" fontWeight="700" fontFamily="sans-serif">
            {s.name}
          </text>
          <text x={s.x} y={s.y + 12} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">
            {s.location}
          </text>
          <text x={s.x} y={s.y + 24} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="sans-serif">
            {s.voltage} · {s.capacity.toLocaleString()}kW
          </text>
        </g>
      ))}

      {/* Platforms */}
      {PLATFORMS.map((p) => {
        const load = Math.round(p.baseLoad + Math.sin(simHour * 1.3 + p.id) * 90);
        return (
          <g key={`p${p.id}`}>
            <circle cx={p.x} cy={p.y} r={90} fill="url(#pglow)" />
            <circle cx={p.x} cy={p.y} r={58} fill="none" stroke={C.accent} strokeWidth="0.5" opacity="0.15" strokeDasharray="3,5">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y}`} to={`360 ${p.x} ${p.y}`} dur="30s" repeatCount="indefinite" />
            </circle>
            <rect x={p.x - 58} y={p.y - 30} width={116} height={60} rx={14} fill={C.bgCard} stroke={C.accent} strokeWidth="1" filter="url(#ds)" opacity="0.95" />
            <rect x={p.x - 58} y={p.y - 30} width={116} height={2} rx={1} fill={C.accent} opacity="0.4" />
            <circle cx={p.x - 38} cy={p.y - 10} r={3.5} fill={C.accent}>
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x={p.x - 28} y={p.y - 6} fill={C.accent} fontSize="13" fontWeight="700" fontFamily="sans-serif">
              {p.name}
            </text>
            <text x={p.x} y={p.y + 10} textAnchor="middle" fill={C.textSec} fontSize="10" fontFamily="sans-serif">
              {p.location}
            </text>
            <text x={p.x} y={p.y + 22} textAnchor="middle" fill={C.textMut} fontSize="9" fontFamily="'Courier New',monospace">
              {load} kW 负荷
            </text>
          </g>
        );
      })}

      {/* Batteries */}
      {batteries.map((b) => {
        const p = pos(b);
        const sc = SC[b.st];
        const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
        const moving = b.st === 'to_station' || b.st === 'to_platform';
        return (
          <g key={b.id}>
            {moving && (
              <circle cx={p.x} cy={p.y + 2} r={22} fill="none" stroke={C.amber} strokeWidth="0.8" opacity="0.3" strokeDasharray="3,4">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${p.x} ${p.y + 2}`} to={`360 ${p.x} ${p.y + 2}`} dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <rect x={p.x - 22} y={p.y - 12} width={44} height={24} rx={7} fill={C.bg} stroke={sc} strokeWidth="1.3" filter="url(#gl)" />
            <rect x={p.x - 18} y={p.y - 1} width={Math.max(1, (36 * b.soc) / 100)} height={4} rx={2} fill={socC} opacity="0.75">
              {b.st === 'charging' && <animate attributeName="opacity" values="0.75;0.4;0.75" dur="1.5s" repeatCount="indefinite" />}
            </rect>
            <rect x={p.x + 22} y={p.y - 3} width={3} height={6} rx={1.5} fill={sc} opacity="0.4" />
            <text x={p.x} y={p.y - 4} textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="800" fontFamily="'Courier New',monospace">
              {Math.round(b.soc)}%
            </text>
            <text x={p.x} y={p.y + 22} textAnchor="middle" fill={sc} fontSize="9.5" fontWeight="800" fontFamily="'Courier New',monospace" letterSpacing="1">
              {b.name}
            </text>
            <text x={p.x} y={p.y + 33} textAnchor="middle" fill={C.textMut} fontSize="8" fontFamily="sans-serif">
              {SL[b.st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default MapView;
