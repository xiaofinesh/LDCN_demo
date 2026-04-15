import React, { useMemo, useState } from 'react';
import Panel from '../components/Panel';
import Metric from '../components/Metric';
import { C } from '../constants/colors';
import { ALERTS } from '../data/alerts';
import { INITIAL_FLEET } from '../data/fleet';
import { PLATFORMS } from '../data/platforms';
import type { AlertItem, AlertLevel } from '../types';

const LEVEL_META: Record<AlertLevel, { color: string; label: string; icon: string }> = {
  info: { color: C.blue, label: '提示', icon: '·' },
  warn: { color: C.amber, label: '预警', icon: '△' },
  critical: { color: C.red, label: '严重', icon: '⚠' },
};

type FilterMode = 'all' | 'unresolved' | AlertLevel;

const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unresolved':
        return ALERTS.filter((a) => !a.resolved);
      case 'info':
      case 'warn':
      case 'critical':
        return ALERTS.filter((a) => a.level === filter);
      default:
        return ALERTS;
    }
  }, [filter]);

  const counts = useMemo(() => {
    return {
      total: ALERTS.length,
      unresolved: ALERTS.filter((a) => !a.resolved).length,
      critical: ALERTS.filter((a) => a.level === 'critical').length,
      warn: ALERTS.filter((a) => a.level === 'warn').length,
    };
  }, []);

  const FILTERS: Array<{ key: FilterMode; label: string; color?: string }> = [
    { key: 'all', label: '全部' },
    { key: 'unresolved', label: '未处理' },
    { key: 'critical', label: '严重', color: C.red },
    { key: 'warn', label: '预警', color: C.amber },
    { key: 'info', label: '提示', color: C.blue },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Metric label="告警总数（24h）" value={counts.total} unit="条" color={C.text} sub="系统自动采集" animated />
        <Metric label="未处理" value={counts.unresolved} unit="条" color={C.amber} sub="需人工确认" animated />
        <Metric label="严重告警" value={counts.critical} unit="条" color={C.red} sub="温度 / 通讯异常" animated />
        <Metric label="预警" value={counts.warn} unit="条" color={C.amber} sub="SOC / SOH" animated />
      </div>

      <Panel
        title="告警中心"
        extra={
          <div style={{ display: 'flex', gap: 6 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontSize: 10,
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: filter === f.key ? `${f.color || C.accent}18` : 'transparent',
                  color: filter === f.key ? f.color || C.accent : C.textSec,
                  border: `1px solid ${filter === f.key ? f.color || C.accent : C.border}`,
                  fontWeight: 600,
                  transition: 'all .2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: C.textMut, fontSize: 12 }}>
              当前筛选下没有告警
            </div>
          )}
          {filtered.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      </Panel>
    </div>
  );
};

const AlertRow: React.FC<{ alert: AlertItem }> = ({ alert }) => {
  const meta = LEVEL_META[alert.level];
  const battery = alert.batteryId ? INITIAL_FLEET.find((b) => b.id === alert.batteryId) : null;
  const platform = alert.platformId ? PLATFORMS.find((p) => p.id === alert.platformId) : null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 80px 1fr auto 90px',
        gap: 12,
        alignItems: 'center',
        padding: '12px 14px',
        background: alert.resolved ? `${C.border}20` : `${meta.color}08`,
        border: `1px solid ${alert.resolved ? C.border : `${meta.color}30`}`,
        borderRadius: 10,
        transition: 'all .2s',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontFamily: "'Courier New',monospace",
          fontWeight: 700,
          color: meta.color,
        }}
      >
        {alert.t}
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          padding: '3px 8px',
          background: `${meta.color}18`,
          color: meta.color,
          border: `1px solid ${meta.color}30`,
          borderRadius: 6,
          fontWeight: 700,
          justifySelf: 'start',
        }}
      >
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>
          {alert.title}
          {battery && (
            <span style={{ marginLeft: 10, fontSize: 10, color: meta.color, fontFamily: "'Courier New',monospace" }}>
              · {battery.name}
            </span>
          )}
          {platform && (
            <span style={{ marginLeft: 10, fontSize: 10, color: C.textMut }}>
              · {platform.name}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.55 }}>{alert.detail}</div>
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "'Courier New',monospace",
          color: C.textMut,
        }}
      >
        {alert.id}
      </div>
      <div
        style={{
          fontSize: 10,
          padding: '3px 10px',
          borderRadius: 12,
          fontWeight: 600,
          textAlign: 'center',
          background: alert.resolved ? `${C.accent}15` : `${C.amber}15`,
          color: alert.resolved ? C.accent : C.amber,
          border: `1px solid ${alert.resolved ? C.accent : C.amber}30`,
        }}
      >
        {alert.resolved ? '✓ 已处理' : '· 待处理'}
      </div>
    </div>
  );
};

export default AlertsPage;
