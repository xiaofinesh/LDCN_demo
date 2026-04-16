import React from 'react';
import { C } from '../constants/colors';
import Metric from './Metric';
import { totalChargingPower, totalSupplyingPower } from '../utils/simulation';
import { HISTORY_STATS } from '../data/history';
import { PLATFORMS } from '../data/platforms';
import type { Battery } from '../types';

interface MetricRowProps {
  batteries: Battery[];
  power: number;
  energy: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ batteries, power, energy }) => {
  const supCount = batteries.filter((b) => b.st === 'supplying').length;
  const chargingCount = batteries.filter((b) => b.st === 'charging').length;
  const avgSoc = Math.round(batteries.reduce((a, b) => a + b.soc, 0) / batteries.length);
  const chargePow = Math.round(totalChargingPower(batteries));
  const supplyPow = Math.round(totalSupplyingPower(batteries));
  const perPlatformToday = Math.round(energy / PLATFORMS.length);
  const dayDelta = perPlatformToday
    ? Math.round((perPlatformToday / HISTORY_STATS.mean - 1) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      <Metric
        label="供电状态"
        value="正常"
        unit=""
        color={C.accent}
        sub={`${supCount} 块供电 · ${chargingCount} 块充电`}
      />
      <Metric
        label="实时平台负荷"
        value={power}
        unit="kW"
        color={C.blue}
        sub={`3 平台基线 ${PLATFORMS.reduce((a, p) => a + p.baseLoad, 0).toLocaleString()} kW`}
        animated
      />
      <Metric
        label="实时充电功率"
        value={chargePow}
        unit="kW"
        color={C.cyan}
        sub={`${chargingCount} 块充电 · 能量流入`}
        animated
      />
      <Metric
        label="实时放电功率"
        value={supplyPow}
        unit="kW"
        color={C.accent}
        sub={`${supCount} 块供电 · 能量流出`}
        animated
      />
      <Metric
        label="电池组平均 SOC"
        value={avgSoc}
        unit="%"
        color={C.amber}
        sub={`${batteries.length} 块 · 5,000 kWh/块`}
        animated
      />
      <Metric
        label="今日累计用电"
        value={energy}
        unit="kWh"
        color={C.purple}
        sub={
          perPlatformToday > 0
            ? `平均/平台 ${perPlatformToday.toLocaleString()} · 相对 75 天均值 ${dayDelta >= 0 ? '+' : ''}${dayDelta}%`
            : `75 天均值 ${HISTORY_STATS.mean.toLocaleString()} kWh/平台·天`
        }
        animated
      />
    </div>
  );
};

export default MetricRow;
