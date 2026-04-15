import React from 'react';
import { C } from '../constants/colors';
import Metric from './Metric';
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
        label="实时总功率"
        value={power}
        unit="kW"
        color={C.blue}
        sub="3 平台负荷合计"
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
      <Metric label="预估日节省" value={1582} unit="元" color={C.accent} sub="充电成本优化 ≈20%" animated />
      <Metric label="年化节省" value="47.5" unit="万" color={C.cyan} sub="按300天运营计算" />
    </div>
  );
};

export default MetricRow;
