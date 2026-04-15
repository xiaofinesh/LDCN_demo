import React from 'react';
import { C } from '../constants/colors';
import { SC, SL } from '../constants/status';
import type { Battery } from '../types';

interface BatteryCardProps {
  b: Battery;
  power: number;
  onClick?: () => void;
  compact?: boolean;
}

const BatteryCard: React.FC<BatteryCardProps> = ({ b, power, onClick, compact }) => {
  const sc = SC[b.st];
  const socC = b.soc > 55 ? C.accent : b.soc > 20 ? C.amber : C.red;
  const avail = Math.round((b.soc / 100) * b.capacity * 0.95);
  const hrs = b.st === 'supplying' && power > 0 ? Math.max(1, Math.round(avail / power)) : null;
  return (
    <div
      onClick={onClick}
      style={{
        background: C.bgCard,
        border: `1px solid ${sc}22`,
        borderRadius: 14,
        padding: compact ? '12px 14px' : '14px 18px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color .4s, transform .2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}66`;
      }}
      onMouseLeave={(e) => {
        if (onClick) (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}22`;
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${sc} 50%, transparent 100%)`,
          opacity: 0.45,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div
            style={{
              fontSize: compact ? 14 : 16,
              fontWeight: 800,
              color: C.text,
              fontFamily: "'Courier New',monospace",
              letterSpacing: 2,
            }}
          >
            {b.name}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 5,
              fontSize: 10,
              padding: '2px 10px',
              borderRadius: 20,
              background: `${sc}15`,
              color: sc,
              fontWeight: 600,
              border: `1px solid ${sc}25`,
            }}
          >
            {SL[b.st]}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: compact ? 24 : 30,
              fontWeight: 800,
              color: socC,
              fontFamily: "'Courier New',monospace",
              lineHeight: 1,
            }}
          >
            {Math.round(b.soc)}
            <span style={{ fontSize: 13, opacity: 0.7 }}>%</span>
          </div>
        </div>
      </div>

      <div style={{ height: 7, background: `${C.border}80`, borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
        <div
          style={{
            width: `${b.soc}%`,
            height: '100%',
            borderRadius: 4,
            background: `linear-gradient(90deg, ${socC}80, ${socC})`,
            transition: 'width .8s ease',
            boxShadow: `0 0 10px ${socC}30`,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMut }}>
        <span>{b.capacity.toLocaleString()} kWh</span>
        <span style={{ color: C.textSec }}>可用 {avail.toLocaleString()} kWh</span>
        {hrs ? (
          <span style={{ color: C.accent, fontWeight: 700 }}>≈ {hrs}h</span>
        ) : (
          <span style={{ color: C.textMut }}>SOH {b.soh}%</span>
        )}
      </div>
    </div>
  );
};

export default BatteryCard;
