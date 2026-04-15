import React from 'react';
import { C } from '../constants/colors';

interface PanelProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string | number;
}

const Panel: React.FC<PanelProps> = ({ title, extra, children, style, padding = '16px 20px' }) => {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: C.textSec,
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{title}</span>
          {extra && <span style={{ fontSize: 10, color: C.textMut, fontWeight: 400 }}>{extra}</span>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Panel;
