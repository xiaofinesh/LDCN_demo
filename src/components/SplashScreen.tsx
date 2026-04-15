import React, { useEffect, useState } from 'react';
import { C } from '../constants/colors';

interface SplashScreenProps {
  onDone: () => void;
}

const TEXTS = [
  '加载 MILP 优化引擎',
  '载入 LSTM 负荷预测模型',
  '连接 RL 动态调度策略',
  '同步 3 平台 · 8 电池 · 2 充电站',
  '系统就绪',
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= TEXTS.length - 1) {
          clearInterval(t);
          setTimeout(() => {
            setLeaving(true);
            setTimeout(onDone, 450);
          }, 420);
          return s;
        }
        return s + 1;
      });
    }, 320);
    return () => clearInterval(t);
  }, [onDone]);

  const pct = ((step + 1) / TEXTS.length) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${C.bgCard}, ${C.bg} 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        zIndex: 9999,
        opacity: leaving ? 0 : 1,
        transition: 'opacity .45s ease',
        fontFamily: "'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif",
      }}
    >
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.accent} />
            <stop offset="100%" stopColor={C.blue} />
          </linearGradient>
          <filter id="sgl"><feGaussianBlur stdDeviation="3.5" /></filter>
        </defs>
        {/* Rotating rings */}
        <circle cx="100" cy="100" r="86" fill="none" stroke={C.border} strokeWidth="0.6" opacity="0.5" />
        <circle cx="100" cy="100" r="72" fill="none" stroke={C.accent} strokeWidth="1" strokeDasharray="4 8" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="100" r="58" fill="none" stroke={C.blue} strokeWidth="1" strokeDasharray="3 6" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="10s" repeatCount="indefinite" />
        </circle>
        {/* Center badge */}
        <circle cx="100" cy="100" r="42" fill={C.bgCard} stroke="url(#sg)" strokeWidth="1.6" filter="url(#sgl)" />
        <circle cx="100" cy="100" r="42" fill="url(#sg)" opacity="0.08" />
        <path
          d="M104 72 L82 108 H98 L94 128 L118 92 H102 Z"
          fill="url(#sg)"
          style={{ filter: `drop-shadow(0 0 6px ${C.accent})` }}
        />
      </svg>

      <div style={{ marginTop: 24, fontSize: 22, fontWeight: 800, letterSpacing: 1.5, color: C.text }}>
        电池智能调度系统
      </div>
      <div style={{ fontSize: 11, color: C.textMut, marginTop: 6, letterSpacing: 2 }}>
        LDCN · LITHIUM DISPATCH CONTROL NETWORK
      </div>

      {/* Progress */}
      <div
        style={{
          marginTop: 36,
          width: 320,
          height: 3,
          background: `${C.border}80`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg,${C.accent},${C.blue})`,
            boxShadow: `0 0 10px ${C.accent}`,
            transition: 'width .3s ease',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: C.textSec,
          fontFamily: "'Courier New',monospace",
          letterSpacing: 1,
        }}
      >
        [{String(step + 1).padStart(2, '0')}/{String(TEXTS.length).padStart(2, '0')}] {TEXTS[step]}
      </div>

      <div style={{ marginTop: 40, fontSize: 10, color: C.textMut, letterSpacing: 1.2 }}>
        上海神机智物人工智能科技有限公司
      </div>
    </div>
  );
};

export default SplashScreen;
