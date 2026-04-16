import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { C, FONT_MONO, FONT_SANS } from '../constants/tokens';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', label: '主控台', end: true },
  { to: '/battery', label: '电池管理' },
  { to: '/drilling-plan', label: '钻井计划' },
  { to: '/alerts', label: '告警中心' },
  { to: '/pricing-report', label: '运营报表' },
];

const AppLayout: React.FC = () => {
  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        minHeight: '100vh',
        fontFamily: FONT_SANS,
      }}
    >
      {/* Top navigation */}
      <div
        style={{
          height: 64,
          background: C.bgCard,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          gap: 24,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}
      >
        <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 900,
                color: '#fff',
                boxShadow: `0 2px 8px ${C.accent}40`,
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3, color: C.text }}>
                电池智能调度平台
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMut,
                  marginTop: 1,
                  letterSpacing: 1,
                }}
              >
                LDCN · v1.0
              </div>
            </div>
          </div>
        </NavLink>

        <div style={{ flex: 1 }} />

        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              color: isActive ? C.accent : C.textSec,
              padding: '8px 14px',
              borderRadius: 7,
              background: isActive ? C.accentLight : 'transparent',
              transition: 'all 0.15s',
              textDecoration: 'none',
            })}
          >
            {item.label}
          </NavLink>
        ))}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginLeft: 8,
            paddingLeft: 16,
            borderLeft: `1px solid ${C.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT_MONO }}>
            2026-04-16 14:32
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                color: '#fff',
                fontWeight: 800,
              }}
            >
              管
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>张管理员</div>
              <div style={{ fontSize: 10, color: C.textMut }}>客户管理员</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1480, margin: '0 auto' }}>
        <Outlet />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          padding: '16px 28px',
          borderTop: `1px solid ${C.border}`,
          maxWidth: 1480,
          margin: '24px auto 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: C.textMut }}>
          电池智能调度平台 · 上海神机智物人工智能科技有限公司 © 2026
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 11, color: C.textMut }}>
            系统延迟{' '}
            <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>12 ms</span>
          </span>
          <span style={{ fontSize: 11, color: C.textMut }}>
            MQTT{' '}
            <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>● 已连接</span>
          </span>
          <span style={{ fontSize: 11, color: C.textMut }}>
            数据刷新{' '}
            <span style={{ color: C.accent, fontFamily: FONT_MONO, fontWeight: 700 }}>30s</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
