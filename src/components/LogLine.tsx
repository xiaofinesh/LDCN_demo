import React from 'react';
import { C } from '../constants/colors';
import type { LogEntry, LogKind } from '../types';

interface LogLineProps {
  item: LogEntry;
}

const LogLine: React.FC<LogLineProps> = ({ item }) => {
  const colors: Record<LogKind, string> = {
    cmd: C.accent,
    warn: C.amber,
    ok: '#34d399',
    info: C.blue,
    sys: C.purple,
  };
  const icons: Record<LogKind, string> = {
    cmd: '▸',
    warn: '△',
    ok: '✓',
    info: '·',
    sys: '◈',
  };
  const c = colors[item.k] || C.textMut;
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '6px 0',
        borderBottom: `1px solid ${C.border}30`,
        fontSize: 12,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          color: `${c}cc`,
          fontFamily: "'Courier New',monospace",
          fontSize: 11,
          flexShrink: 0,
          minWidth: 44,
          fontWeight: 700,
        }}
      >
        {item.t}
      </span>
      <span
        style={{
          color: c,
          fontSize: 12,
          flexShrink: 0,
          width: 14,
          textAlign: 'center',
          lineHeight: '18px',
        }}
      >
        {icons[item.k]}
      </span>
      <span style={{ color: C.textSec, lineHeight: 1.5 }}>{item.m}</span>
    </div>
  );
};

export default LogLine;
