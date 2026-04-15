import React from 'react';
import { NavLink } from 'react-router-dom';
import { C } from '../constants/colors';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', icon: '◉', label: '总览', end: true },
  { to: '/scheduling', icon: '◆', label: '调度中心' },
  { to: '/batteries', icon: '▦', label: '电池管理' },
  { to: '/platforms', icon: '◎', label: '平台拓扑' },
  { to: '/analytics', icon: '▲', label: '运营分析' },
  { to: '/alerts', icon: '△', label: '告警中心' },
  { to: '/settings', icon: '⚙', label: '参数配置' },
];

const Sidebar: React.FC = () => {
  return (
    <aside
      style={{
        width: 208,
        background: C.bgCard,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '22px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `linear-gradient(135deg,${C.accent},${C.blue})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#000',
            fontWeight: 900,
            boxShadow: `0 4px 16px ${C.accent}30`,
          }}
        >
          ⚡
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: 0.5 }}>
            神机智物
          </div>
          <div style={{ fontSize: 9, color: C.textMut, marginTop: 2 }}>LDCN · v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div
          style={{
            fontSize: 9,
            color: C.textMut,
            padding: '8px 10px 6px',
            letterSpacing: 1.5,
            fontWeight: 600,
          }}
        >
          主菜单
        </div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '9px 12px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? C.accent : C.textSec,
              background: isActive ? `${C.accent}14` : 'transparent',
              borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent',
              transition: 'all .18s',
            })}
          >
            <span style={{ fontSize: 13, width: 14, textAlign: 'center' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${C.border}`,
          fontSize: 10,
          color: C.textMut,
          lineHeight: 1.6,
        }}
      >
        <div style={{ color: C.textSec, fontWeight: 700, marginBottom: 4 }}>演示环境</div>
        <div>模拟数据 · 实际部署</div>
        <div>对接 SCADA 与电力调度</div>
      </div>
    </aside>
  );
};

export default Sidebar;
