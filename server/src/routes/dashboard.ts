import { Router } from 'express';
import { getEngine, HOUR_TIER, TIERS } from '../engine.js';

const r = Router();

/** GET /api/dashboard — 主控台全量数据（统一引擎驱动） */
r.get('/', (_req, res) => {
  const snap = getEngine().snapshot();

  const supplying = snap.batteries.find(b => b.status === 'supplying');
  const chargingBats = snap.batteries.filter(b => b.status === 'charging');
  const activeAlerts = snap.recentAlerts.filter(a => a.status === 'processing').length;

  res.json({
    ok: true,
    simTime: snap.simTime,
    simHour: snap.simHour,
    simDay: snap.simDay,

    kpi: {
      supplyStatus: supplying ? '正常' : '无供电',
      supplyDetail: supplying
        ? `${supplying.name} 供电中 · SOC ${Math.round(supplying.soc)}%`
        : '当前无电池在供电',
      power: snap.platformLoad,
      onlineCount: `${snap.batteries.length}/${snap.batteries.length}`,
      dischargePower: supplying ? Math.abs(supplying.power) : 0,
      chargePower: chargingBats.reduce((a, b) => a + b.power, 0),
      activeAlerts,
    },

    tier: {
      key: snap.tierKey,
      label: snap.tierInfo.label,
      price: snap.tierInfo.price,
    },

    batteries: snap.batteries,

    activity: snap.recentAlerts.slice(0, 6).map(a => ({
      level: a.level === 'red' || a.level === 'orange' ? 'warn' : a.level === 'blue' ? 'info' : 'ok',
      time: a.time.split(' ')[1]?.slice(0, 5) ?? a.time,
      msg: `${a.title} · ${a.target}`,
    })),

    schedule: snap.schedule,

    hourTiers: HOUR_TIER.map((k, i) => ({
      hour: i,
      tier: k,
      label: TIERS[k].label,
      price: TIERS[k].price,
    })),

    energy: {
      cumulative: snap.cumulativeEnergy,
      cost: snap.cumulativeCost,
      baseline: snap.baselineCost,
      savings: snap.savings,
    },
  });
});

export default r;
