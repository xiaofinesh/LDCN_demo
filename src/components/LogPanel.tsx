import React, { useEffect, useRef } from 'react';
import { C } from '../constants/colors';
import LogLine from './LogLine';
import type { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [logs.length]);

  return (
    <div
      ref={logRef}
      style={{
        gridColumn: '1/-1',
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '16px 20px',
        maxHeight: 280,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: C.textSec,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: C.bgCard,
          paddingBottom: 8,
          zIndex: 1,
        }}
      >
        <span>调度日志</span>
        <span style={{ fontSize: 10, color: C.textMut, fontWeight: 400 }}>{logs.length} 条</span>
      </div>
      {logs.length === 0 && (
        <div style={{ color: C.textMut, fontSize: 12, textAlign: 'center', padding: 30 }}>
          点击「▶ 启动模拟」查看实时调度日志
        </div>
      )}
      {[...logs].reverse().map((l, i) => (
        <LogLine key={i} item={l} />
      ))}
    </div>
  );
};

export default LogPanel;
