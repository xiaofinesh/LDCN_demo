import React from 'react';
import { C } from '../constants/colors';
import { EVENTS } from '../constants/schedule';
import { BNAME } from '../constants/status';
import { fmt } from '../utils/format';
import type { Battery } from '../types';

interface GanttProps {
  batteries: Battery[];
  simHour: number;
}

const Gantt: React.FC<GanttProps> = ({ batteries, simHour }) => {
  const pct = (h: number): number => (h / 24) * 100;
  return (
    <div>
      <div style={{ position: 'relative', height: 18, marginBottom: 4, marginLeft: 54 }}>
        {Array.from({ length: 13 }, (_, i) => i * 2).map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              left: `${pct(h)}%`,
              transform: 'translateX(-50%)',
              fontSize: 9,
              color: C.textMut,
              fontFamily: "'Courier New',monospace",
            }}
          >
            {fmt(h)}
          </div>
        ))}
      </div>
      {batteries.map((b) => {
        const evts = EVENTS.filter((e) => e.b === b.id);
        return (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div
              style={{
                width: 50,
                fontSize: 11,
                color: C.textSec,
                fontWeight: 700,
                flexShrink: 0,
                fontFamily: "'Courier New',monospace",
                textAlign: 'right',
                paddingRight: 8,
              }}
            >
              {BNAME[b.id - 1]}
            </div>
            <div
              style={{
                flex: 1,
                height: 26,
                background: `${C.border}50`,
                borderRadius: 6,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <div
                  key={h}
                  style={{
                    position: 'absolute',
                    left: `${pct(h)}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: C.border,
                    opacity: 0.3,
                  }}
                />
              ))}
              {evts.map((ev, i) => {
                const w = pct(ev.e) - pct(ev.s);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${pct(ev.s)}%`,
                      width: `${w}%`,
                      height: '100%',
                      background: `linear-gradient(135deg, ${ev.c}45, ${ev.c}20)`,
                      borderLeft: `2.5px solid ${ev.c}`,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: '#fff',
                      fontWeight: 600,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w > 5.5 ? ev.l : ''}
                  </div>
                );
              })}
              <div
                style={{
                  position: 'absolute',
                  left: `${pct(simHour)}%`,
                  top: -2,
                  bottom: -2,
                  width: 2,
                  background: C.text,
                  borderRadius: 1,
                  boxShadow: `0 0 8px ${C.text}60`,
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { l: '供电', c: C.accent },
          { l: '充电', c: C.blue },
          { l: '运输', c: C.amber },
          { l: '平台待命', c: C.cyan },
          { l: '换电', c: C.purple },
        ].map((x) => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 8, borderRadius: 2, background: x.c, opacity: 0.65 }} />
            <span style={{ fontSize: 10, color: C.textSec }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gantt;
