import React from 'react';
import { C } from '../constants/colors';
import { TIERS, tier } from '../constants/pricing';

interface PriceBarProps {
  simHour: number;
}

const PriceBar: React.FC<PriceBarProps> = ({ simHour }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div>
      <div style={{ display: 'flex', height: 56, alignItems: 'flex-end', gap: 1.5, marginBottom: 6 }}>
        {hours.map((h) => {
          const t = tier(h);
          const info = TIERS[t];
          const cur = Math.floor(simHour) === h;
          const ht = (info.p / 1.12) * 100;
          return (
            <div key={h} style={{ flex: 1, position: 'relative' }}>
              <div
                style={{
                  height: `${ht}%`,
                  background: cur ? `linear-gradient(180deg,${info.c},${info.c}60)` : `${info.c}28`,
                  borderRadius: '4px 4px 0 0',
                  transition: 'all .4s',
                  boxShadow: cur ? `0 -4px 16px ${info.c}30, inset 0 1px 0 ${info.c}80` : 'none',
                  border: cur ? `1px solid ${info.c}60` : '1px solid transparent',
                  borderBottom: 'none',
                }}
              />
              {cur && (
                <div
                  style={{
                    position: 'absolute',
                    top: -22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: info.c,
                    color: '#000',
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 5,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Courier New',monospace",
                    boxShadow: `0 2px 8px ${info.c}40`,
                  }}
                >
                  ¥{info.p.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 1.5 }}>
        {hours.map((h) => (
          <div
            key={h}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 8,
              color: Math.floor(simHour) === h ? C.text : C.textMut,
              fontFamily: "'Courier New',monospace",
              fontWeight: Math.floor(simHour) === h ? 700 : 400,
            }}
          >
            {h % 2 === 0 ? h : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(TIERS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: v.c, opacity: 0.75 }} />
            <span style={{ fontSize: 10, color: C.textSec }}>{k}</span>
            <span style={{ fontSize: 9, color: C.textMut, fontFamily: "'Courier New',monospace" }}>
              ¥{v.p.toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceBar;
