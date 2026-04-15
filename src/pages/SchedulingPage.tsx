import React, { useMemo } from 'react';
import Panel from '../components/Panel';
import Gantt from '../components/Gantt';
import PriceBar from '../components/PriceBar';
import LogPanel from '../components/LogPanel';
import Metric from '../components/Metric';
import { C } from '../constants/colors';
import { LOGS } from '../constants/logs';
import { EVENTS } from '../constants/schedule';
import { simBatteries } from '../utils/simulation';
import { useAppContext } from '../hooks/useAppContext';

const SchedulingPage: React.FC = () => {
  const { sim } = useAppContext();
  const { simHour } = sim;
  const batteries = useMemo(() => simBatteries(simHour), [simHour]);
  const logs = LOGS.filter((l) => {
    const [hh, mm] = l.t.split(':').map(Number);
    return hh + mm / 60 <= simHour + 0.1;
  });

  const totalEvents = EVENTS.length;
  const swapCount = EVENTS.filter((e) => e.l === '换电').length;
  const chargeHours = EVENTS.filter((e) => e.l === '充电').reduce((a, e) => a + (e.e - e.s), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Metric label="今日调度事件" value={totalEvents} unit="项" color={C.accent} sub="MILP 引擎自动生成" animated />
        <Metric label="热切换次数" value={swapCount} unit="次" color={C.purple} sub="零断电策略" animated />
        <Metric label="充电总时长" value={chargeHours.toFixed(1)} unit="小时" color={C.blue} sub="集中低谷时段" />
        <Metric label="调度引擎状态" value="OPTIMAL" unit="" color={C.accent} sub="MILP · LSTM · RL 三引擎协同" />
      </div>

      <Panel
        title="全机组 24h 调度甘特图"
        extra={<span style={{ color: C.accent, fontFamily: "'Courier New',monospace" }}>MILP 优化结果</span>}
      >
        <Gantt batteries={batteries} simHour={simHour} />
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Panel title="分时电价指引" extra="河北电网 · 1-10kV">
          <PriceBar simHour={simHour} />
        </Panel>
        <Panel title="调度策略" extra="三引擎协同">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                n: 'MILP',
                c: C.accent,
                t: '混合整数线性规划',
                d: '以充电成本最小化为目标，生成全天最优调度基线（启发式热启动）',
              },
              {
                n: 'LSTM',
                c: C.blue,
                t: '长短时记忆网络',
                d: '预测未来 24h 平台用电负荷，修正静态调度计划',
              },
              {
                n: 'RL',
                c: C.purple,
                t: '强化学习',
                d: '应对突发负荷波动与换电失败，在线 fine-tune 执行窗口',
              },
            ].map((x) => (
              <div
                key={x.n}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${x.c}30`,
                  borderRadius: 10,
                  background: `${x.c}08`,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span
                    style={{
                      color: x.c,
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: "'Courier New',monospace",
                      letterSpacing: 1,
                    }}
                  >
                    {x.n}
                  </span>
                  <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{x.t}</span>
                </div>
                <div style={{ fontSize: 11, color: C.textMut, marginTop: 5, lineHeight: 1.55 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 16 }}>
        <LogPanel logs={logs} />
      </div>
    </div>
  );
};

export default SchedulingPage;
