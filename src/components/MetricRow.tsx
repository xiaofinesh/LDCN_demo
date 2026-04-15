import React from 'react';
import { C } from '../constants/colors';
import Metric from './Metric';
import { totalChargingPower, totalSupplyingPower } from '../utils/simulation';
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
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      <Metric
        label="供电状态"
        value="正常"
        unit=""
        color={C.accent}
        sub={`${supCount} 块供电中 · ${chargingCount} 块充电中`}
      />
      <Metric
        label="实时平台负荷"
        value={power}
        unit="kW"
        color={C.blue}
        sub="3 平台用电功率合计"
        animated
      />
      <Metric
        label="累计用电"
        value={energy}
        unit="kWh"
        color={C.purple}
        sub="日均 11,302 kWh"
        animated
      />
      <Metric
        label="电池组平均 SOC"
        value={avgSoc}
        unit="%"
        color={C.amber}
        sub={`共 ${batteries.length} 块 · 5,000 kWh/块`}
        animated
      />
      <Metric
        label="实时充电功率"
        value={chargePow}
        unit="kW"
        color={C.cyan}
        sub={`${chargingCount} 块在充电站 · 充入能量流`}
        animated
      />
      <Metric
        label="实时放电功率"
        value={supplyPow}
        unit="kW"
        color={C.accent}
        sub={`${supCount} 块在供电 · 输出能量流`}
        animated
      />
    </div>
  );
};

export default MetricRow;
