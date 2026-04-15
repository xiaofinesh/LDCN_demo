import React from 'react';
import { C } from '../constants/colors';
import Metric from './Metric';
import { BNAME } from '../constants/status';
import type { Battery } from '../types';

interface MetricRowProps {
  batteries: Battery[];
  power: number;
  energy: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ batteries, power, energy }) => {
  const supBat = batteries.find((b) => b.st === 'supplying');
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
      <Metric
        label="供电状态"
        value="正常"
        unit=""
        color={C.accent}
        sub={supBat ? `${BNAME[supBat.id - 1]} 供电中` : ''}
      />
      <Metric label="实时功率" value={power} unit="kW" color={C.blue} sub="钻井平台负荷" />
      <Metric
        label="累计用电"
        value={energy.toLocaleString()}
        unit="kWh"
        color={C.purple}
        sub="日均 11,302 kWh"
      />
      <Metric label="预估日节省" value="1,582" unit="元" color={C.accent} sub="充电成本优化 ≈20%" />
      <Metric label="年化节省" value="47.5" unit="万" color={C.cyan} sub="按300天运营计算" />
    </div>
  );
};

export default MetricRow;
