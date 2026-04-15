import React, { useMemo } from 'react';
import Panel from '../components/Panel';
import Metric from '../components/Metric';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import Donut from '../components/charts/Donut';
import { C } from '../constants/colors';
import { LOAD_CURVE, SAVINGS_TREND, SOH_DIST } from '../data/savings';
import { TIERS } from '../constants/pricing';
import { simBatteries } from '../utils/simulation';
import { useAppContext } from '../hooks/useAppContext';

const AnalyticsPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);

  const totalSavings = SAVINGS_TREND.reduce((a, p) => a + (p.before - p.after), 0);
  const avgSavings = Math.round(totalSavings / SAVINGS_TREND.length);
  const savingPct = Math.round(
    (totalSavings / SAVINGS_TREND.reduce((a, p) => a + p.before, 0)) * 100,
  );
  const avgSoh = Math.round(SOH_DIST.reduce((a, s) => a + s.soh, 0) / SOH_DIST.length);

  const supplyHours = batteries.filter((b) => b.st === 'supplying').length;
  const chargeHours = batteries.filter((b) => b.st === 'charging').length;
  const transportHours = batteries.filter((b) => b.st === 'to_station' || b.st === 'to_platform').length;
  const standbyHours = batteries.filter((b) => b.st === 'standby').length;
  const swapHours = batteries.filter((b) => b.st === 'swapping').length;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Metric label="14 日累计节约" value={totalSavings} unit="元" color={C.accent} sub={`日均 ¥${avgSavings.toLocaleString()}`} animated />
        <Metric label="成本降幅" value={savingPct} unit="%" color={C.blue} sub="相比未优化基线" animated />
        <Metric label="电池组平均 SOH" value={avgSoh} unit="%" color={C.purple} sub={`共 ${SOH_DIST.length} 块 · 健康`} animated />
        <Metric label="热切换成功率" value={100} unit="%" color={C.cyan} sub="零断电运行" animated />
      </div>

      <Panel title="14 日充电成本对比" extra="优化前 vs MILP + RL 优化后">
        <LineChart
          labels={SAVINGS_TREND.map((s) => s.date)}
          series={[
            {
              name: '未优化（基线）',
              color: C.red,
              values: SAVINGS_TREND.map((s) => s.before),
            },
            {
              name: '智能调度优化',
              color: C.accent,
              values: SAVINGS_TREND.map((s) => s.after),
            },
          ]}
          unit="元"
        />
        <div style={{ marginTop: 10, fontSize: 11, color: C.textMut, lineHeight: 1.6, paddingLeft: 4 }}>
          · 优化策略将充电负荷集中转移至低谷/深谷时段（¥0.37–0.39/度），避开高峰（¥0.94/度）与尖峰（¥1.07/度）
          <br />· 14 日累计节约 <span style={{ color: C.accent, fontWeight: 700 }}>¥{totalSavings.toLocaleString()}</span>，
          年化约 <span style={{ color: C.accent, fontWeight: 700 }}>¥{Math.round(totalSavings * 300 / 14).toLocaleString()}</span>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Panel title="24 小时平台负荷曲线" extra="3 平台合计 · 实时采样">
          <LineChart
            labels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
            series={[
              {
                name: '实测功率',
                color: C.blue,
                values: LOAD_CURVE,
              },
            ]}
            unit="kW"
            height={200}
          />
        </Panel>

        <Panel title="电池组健康度" extra="SOH · 按循环次数差异化">
          <BarChart
            items={SOH_DIST.map((s) => ({
              label: s.name,
              value: s.soh,
              color: s.soh >= 96 ? C.accent : s.soh >= 94 ? C.amber : C.red,
            }))}
            unit="%"
            minValue={88}
            maxValue={100}
            height={220}
          />
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Panel title="当前机组状态分布" extra="实时快照">
          <Donut
            slices={[
              { label: '供电中', value: supplyHours, color: C.accent },
              { label: '充电中', value: chargeHours, color: C.blue },
              { label: '运输中', value: transportHours, color: C.amber },
              { label: '平台待命', value: standbyHours, color: C.cyan },
              { label: '换电中', value: swapHours, color: C.purple },
            ].filter((s) => s.value > 0)}
            centerValue={batteries.length.toString()}
            centerLabel="电池组"
          />
        </Panel>

        <Panel title="分时电价结构" extra="河北电网 · 春季">
          <Donut
            slices={Object.entries(TIERS).map(([k, v]) => ({
              label: `${k} (¥${v.p.toFixed(4)})`,
              value: v.p,
              color: v.c,
            }))}
            centerValue="¥0.67"
            centerLabel="平均电价"
          />
        </Panel>
      </div>
    </div>
  );
};

export default AnalyticsPage;
