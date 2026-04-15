import React from 'react';
import { C } from '../constants/colors';
import { TIERS, tier } from '../constants/pricing';
import { fmt } from '../utils/format';

interface HeaderProps {
  simHour: number;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
}

const Header: React.FC<HeaderProps> = ({ simHour, running, setRunning, speed, setSpeed }) => {
  const curTier = tier(Math.floor(simHour));
  const tInfo = TIERS[curTier];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: `linear-gradient(135deg,${C.accent},${C.blue})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#000',
            fontWeight: 900,
            boxShadow: `0 4px 16px ${C.accent}30`,
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>电池智能调度系统</div>
          <div style={{ fontSize: 11, color: C.textMut, marginTop: 2 }}>
            移动储能钻井平台 · AI驱动运营管理
            <span style={{ marginLeft: 10, color: C.accent, fontWeight: 600 }}>● 运行中</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: `${tInfo.c}0d`,
            border: `1px solid ${tInfo.c}25`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: tInfo.c,
              boxShadow: `0 0 8px ${tInfo.c}`,
            }}
          />
          <span style={{ fontSize: 12, color: tInfo.c, fontWeight: 700 }}>
            {curTier} · ¥{tInfo.p.toFixed(4)}/度
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "'Courier New',monospace",
              color: C.text,
              minWidth: 58,
              letterSpacing: 2,
            }}
          >
            {fmt(simHour, Math.floor((simHour % 1) * 60))}
          </div>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <button
            onClick={() => setRunning(!running)}
            style={{
              background: running ? `${C.red}18` : `${C.accent}18`,
              border: `1px solid ${running ? C.red : C.accent}35`,
              color: running ? C.red : C.accent,
              padding: '5px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {running ? '⏸ 暂停' : '▶ 启动模拟'}
          </button>
          <select
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              color: C.textSec,
              padding: '5px 8px',
              borderRadius: 6,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
            <option value={8}>8×</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Header;
