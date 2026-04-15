import React from 'react';
import { useLocation } from 'react-router-dom';
import { C } from '../constants/colors';
import { TIERS, tier } from '../constants/pricing';
import { fmt } from '../utils/format';

interface TopBarProps {
  simHour: number;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
}

const TITLES: Record<string, { title: string; sub: string }> = {
  '/': { title: '运营总览', sub: '全局态势 · 关键指标' },
  '/scheduling': { title: '调度中心', sub: 'MILP + RL 双引擎 · 实时调度' },
  '/batteries': { title: '电池管理', sub: '8 块移动储能电池组 · 健康度监测' },
  '/platforms': { title: '平台拓扑', sub: '3 个钻井平台 · 2 个充电站' },
  '/analytics': { title: '运营分析', sub: '成本节约 · 负荷趋势 · 设备健康' },
  '/alerts': { title: '告警中心', sub: 'AI 诊断 · 智能处置' },
  '/settings': { title: '参数配置', sub: '场景参数 · 策略切换' },
};

const TopBar: React.FC<TopBarProps> = ({ simHour, running, setRunning, speed, setSpeed }) => {
  const loc = useLocation();
  const curTier = tier(Math.floor(simHour));
  const tInfo = TIERS[curTier];
  const meta = TITLES[loc.pathname] || { title: '电池智能调度系统', sub: '' };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 28px',
        borderBottom: `1px solid ${C.border}`,
        background: `${C.bg}cc`,
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.4 }}>{meta.title}</div>
          <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>● 运行中</span>
        </div>
        <div style={{ fontSize: 11, color: C.textMut, marginTop: 3 }}>{meta.sub}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
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
            padding: '6px 12px',
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              fontFamily: "'Courier New',monospace",
              color: C.text,
              minWidth: 58,
              letterSpacing: 2,
            }}
          >
            {fmt(simHour, Math.floor((simHour % 1) * 60))}
          </div>
          <div style={{ width: 1, height: 22, background: C.border }} />
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
            {running ? '⏸ 暂停' : '▶ 启动'}
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
            <option value={16}>16×</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
