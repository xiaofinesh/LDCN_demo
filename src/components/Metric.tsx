import React from 'react';
import { C } from '../constants/colors';
import AnimatedNumber from './AnimatedNumber';

interface MetricProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  sub?: string;
  animated?: boolean;
}

const Metric: React.FC<MetricProps> = ({ label, value, unit, color, sub, animated }) => {
  const numeric = typeof value === 'number';
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${color}18`,
        borderRadius: 14,
        padding: '14px 18px',
        flex: 1,
        minWidth: 140,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle at 100% 0%, ${color}10, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ fontSize: 11, color: C.textMut, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color,
          fontFamily: "'Courier New',monospace",
          lineHeight: 1,
        }}
      >
        {animated && numeric ? <AnimatedNumber value={value as number} /> : value}
        <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 3, opacity: 0.6 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.textMut, marginTop: 6 }}>{sub}</div>}
    </div>
  );
};

export default Metric;
