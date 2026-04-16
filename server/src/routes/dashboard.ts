import { Router } from 'express';
import { state } from '../state.js';

const r = Router();

/** GET /api/dashboard — KPI 聚合 + 实时态势 + 最近告警 */
r.get('/', (_req, res) => {
  const supplying = state.batteries.filter((b) => b.status === 'supplying');
  const standby = state.batteries.filter((b) => b.status === 'standby');
  const charging = state.batteries.filter((b) => b.status === 'charging');
  const totalLoad = supplying.reduce((s, b) => s + Math.abs(b.power), 0);
  const totalCharge = charging.reduce((s, b) => s + b.power, 0);
  const activeAlerts = state.alerts.filter((a) => a.status === 'processing').length;
  const supplyingBat = supplying[0];

  res.json({
    ok: true,
    kpi: {
      supplyStatus: supplying.length > 0 ? '正常' : '中断',
      supplyDetail: supplyingBat ? `${supplyingBat.name} 供电中 · 预计可持续至 17:30` : '无在用电池',
      realtimePower: Math.round(totalLoad),
      realtimePowerDetail: '平台 A-01 钻井负荷',
      onlineCount: `${state.batteries.length}/${state.batteries.length}`,
      onlineDetail: `供电 ${supplying.length} · 待命 ${standby.length} · 充电 ${charging.length}`,
      dischargePower: Math.round(totalLoad),
      dischargeDetail: supplyingBat ? `${supplyingBat.name} → ${supplyingBat.location} · 持续供电中` : '—',
      chargePower: Math.round(totalCharge),
      activeAlerts,
      activeAlertDetail: activeAlerts > 0 ? state.alerts.find((a) => a.status === 'processing')?.title ?? '—' : '无活跃告警',
    },
    batteries: state.batteries,
    activity: state.alerts.slice(0, 4).map((a) => ({
      level: a.level === 'red' ? 'warn' : a.level === 'orange' ? 'warn' : 'info',
      time: a.time.split(' ')[1]?.slice(0, 5) ?? a.time,
      msg: a.title,
    })),
    serverTime: new Date().toISOString(),
  });
});

export default r;
