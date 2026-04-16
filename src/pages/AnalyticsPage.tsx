import React, { useMemo } from 'react';
import Panel from '../components/Panel';
import Metric from '../components/Metric';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import Donut from '../components/charts/Donut';
import EnergySparkline from '../components/EnergySparkline';
import { C } from '../constants/colors';
import { LOAD_CURVE, SAVINGS_TREND, SOH_DIST } from '../data/savings';
import { TIERS } from '../constants/pricing';
import { DAILY_ENERGY_HISTORY, HISTORY_STATS } from '../data/history';
import { simBatteries } from '../utils/simulation';
import { useAppContext } from '../hooks/useAppContext';

const AnalyticsPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);

  const totalSavings = SAVINGS_TREND.reduce((a, p) => a + (p.before - p.after), 0);
  const savingPct = Math.round(
    (totalSavings / SAVINGS_TREND.reduce((a, p) => a + p.before, 0)) * 100,
  );

  const supplyHours = batteries.filter((b) => b.st === 'supplying').length;
  const chargeHours = batteries.filter((b) => b.st === 'charging').length;
  const transportHours = batteries.filter((b) => b.st === 'to_station' || b.st === 'to_platform').length;
  const standbyHours = batteries.filter((b) => b.st === 'standby').length;
  const swapHours = batteries.filter((b) => b.st === 'swapping').length;

  // 75 天详细折线数据
  const historyLabels = DAILY_ENERGY_HISTORY.map((d) => `D${d.day}`);
  const historyValues = DAILY_ENERGY_HISTORY.map((d) => d.kwh);

  // 直方图桶
  const buckets = [
    { lo: 0, hi: 3000, label: '< 3k', color: C.amber },
    { lo: 3000, hi: 8000, label: '3-8k', color: C.blue },
    { lo: 8000, hi: 13000, label: '8-13k', color: C.accent },
    { lo: 13000, hi: 18000, label: '13-18k', color: C.cyan },
    { lo: 18000, hi: 25000, label: '18-25k', color: C.purple },
    { lo: 25000, hi: Infinity, label: '> 25k', color: C.red },
  ].map((b) => ({
    ...b,
    value: DAILY_ENERGY_HISTORY.filter((d) => d.kwh >= b.lo && d.kwh < b.hi).length,
  }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Metric label="75 天均值" value={HISTORY_STATS.mean} unit="kWh" color={C.accent} sub="单平台·日" animated />
        <Metric label="75 天中位数" value={HISTORY_STATS.median} unit="kWh" color={C.purple} sub="≈ 典型工况" animated />
        <Metric label="最高单日" value={HISTORY_STATS.max} unit="kWh" color={C.red} sub={`D-${HISTORY_STATS.maxDay} · 钻探密集`} animated />
        <Metric label="最低单日" value={HISTORY_STATS.min} unit="kWh" color={C.amber} sub={`D-${HISTORY_STATS.minDay} · 停机`} animated />
        <Metric label="波动系数 CV" value={Math.round(HISTORY_STATS.cv * 100)} unit="%" color={C.cyan} sub={`标准差 ${HISTORY_STATS.stdDev.toLocaleString()}`} animated />
        <Metric label="14 日成本降幅" value={savingPct} unit="%" color={C.accent} sub={`累计节约 ¥${totalSavings.toLocaleString()}`} animated />
      </div>

      <Panel title="75 天日用电量趋势" extra={`日均 ${HISTORY_STATS.mean.toLocaleString()} · 波动系数 ${Math.round(HISTORY_STATS.cv * 100)}%`} style={{ marginBottom: 16 }}>
        <EnergySparkline height={140} />
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
        <Panel title="75 天日用电详细" extra="序号逐日">
          <LineChart
            labels={historyLabels}
            series={[{ name: '日用电量 (kWh)', color: C.blue, values: historyValues }]}
            unit=""
            height={260}
          />
        </Panel>
        <Panel title="日用电量分布" extra="kWh 区间 · 75 天" padding="16px 20px 22px">
          <BarChart items={buckets.map((b) => ({ label: b.label, value: b.value, color: b.color }))} unit="天" height={260} />
          <div style={{ marginTop: 8, fontSize: 10, color: C.textMut, lineHeight: 1.6 }}>
            · 8-13k 为日常钻探工况主区间
            <br />· 右尾重 —— 偶发大负荷日占比 ~18%
            <br />· 左尾 5 天为例行停机 / 维护
          </div>
        </Panel>
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
