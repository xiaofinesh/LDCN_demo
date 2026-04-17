import React from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_MONO } from '../constants/tokens';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: C.accent,
          fontFamily: FONT_MONO,
          letterSpacing: -4,
          lineHeight: 1,
          marginBottom: 12,
          background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 10 }}>
        页面未找到
      </div>
      <div style={{ fontSize: 14, color: C.textSec, marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
        您访问的页面不存在，可能已被移除或 URL 拼写有误
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            fontSize: 13,
            padding: '10px 20px',
            borderRadius: 7,
            background: C.bgCard,
            color: C.textSec,
            border: `1px solid ${C.border}`,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          ← 返回上页
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            fontSize: 13,
            padding: '10px 22px',
            borderRadius: 7,
            background: C.accent,
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            border: 'none',
            fontFamily: 'inherit',
            boxShadow: `0 2px 6px ${C.accent}40`,
          }}
        >
          回到主控台
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
