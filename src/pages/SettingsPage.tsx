import React, { useState } from 'react';
import Panel from '../components/Panel';
import { C } from '../constants/colors';
import { TIERS } from '../constants/pricing';

type Strategy = 'cost_min' | 'load_balance' | 'max_redundancy';

const STRATEGY: Record<Strategy, { title: string; desc: string; color: string }> = {
  cost_min: {
    title: '成本最小',
    desc: '以充电成本最小化为目标，最大化利用低谷/深谷时段。适合稳定负荷场景。',
    color: C.accent,
  },
  load_balance: {
    title: '负荷均衡',
    desc: '在成本与平台供电裕度之间取平衡，适度容错负荷波动。推荐日常运营。',
    color: C.blue,
  },
  max_redundancy: {
    title: '最高冗余',
    desc: '平台始终保持 ≥1 块备用电池待命，降低断电风险。用于关键钻探作业。',
    color: C.purple,
  },
};

const SettingsPage: React.FC = () => {
  const [strategy, setStrategy] = useState<Strategy>('cost_min');
  const [platformCount, setPlatformCount] = useState(3);
  const [batteryCount, setBatteryCount] = useState(8);
  const [simInterval, setSimInterval] = useState(100);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="调度策略" extra="MILP 目标函数切换">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(Object.keys(STRATEGY) as Strategy[]).map((k) => {
              const s = STRATEGY[k];
              const active = strategy === k;
              return (
                <div
                  key={k}
                  onClick={() => setStrategy(k)}
                  style={{
                    padding: '14px 16px',
                    border: `1px solid ${active ? s.color : C.border}`,
                    borderRadius: 10,
                    background: active ? `${s.color}10` : C.bgCard,
                    cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        border: `2px solid ${active ? s.color : C.textMut}`,
                        background: active ? s.color : 'transparent',
                        boxShadow: active ? `0 0 8px ${s.color}` : 'none',
                        transition: 'all .2s',
                      }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? s.color : C.text }}>
                      {s.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.textMut, lineHeight: 1.6, paddingLeft: 26 }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="场景规模参数" extra="调整后点击应用生效">
          <SliderRow
            label="钻井平台数量"
            value={platformCount}
            onChange={setPlatformCount}
            min={1}
            max={6}
            unit="个"
            color={C.accent}
            help="> 3 时系统自动启用分层调度"
          />
          <SliderRow
            label="电池组总数"
            value={batteryCount}
            onChange={setBatteryCount}
            min={3}
            max={20}
            unit="块"
            color={C.blue}
            help="MILP 求解时间 ~ O(n²)"
          />
          <SliderRow
            label="模拟刷新间隔"
            value={simInterval}
            onChange={setSimInterval}
            min={50}
            max={500}
            step={50}
            unit="ms"
            color={C.purple}
            help="仅影响演示速度"
          />

          <div
            style={{
              marginTop: 18,
              padding: '10px 12px',
              background: `${C.amber}10`,
              border: `1px solid ${C.amber}30`,
              borderRadius: 8,
              fontSize: 11,
              color: C.amber,
              lineHeight: 1.55,
            }}
          >
            ⓘ 当前为纯前端 mock 演示。规模参数在生产环境通过 YAML 配置，后台 Python 引擎热加载。
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Panel title="分时电价" extra="河北电网 · 春季">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(TIERS).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: `${v.c}10`,
                  border: `1px solid ${v.c}30`,
                  borderRadius: 8,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 5, background: v.c, boxShadow: `0 0 6px ${v.c}` }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: v.c, flex: 1 }}>{k}</div>
                <div style={{ fontSize: 14, fontFamily: "'Courier New',monospace", color: C.text, fontWeight: 800 }}>
                  ¥{v.p.toFixed(4)}
                  <span style={{ fontSize: 10, color: C.textMut, marginLeft: 3 }}>/度</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="数据源 & 接入" extra="生产环境">
          <InfoLine label="SCADA" value="OPC UA · 实时遥测 1s" status="ok" />
          <InfoLine label="电力调度" value="IEC 61850 · 15min 价格曲线" status="ok" />
          <InfoLine label="天气服务" value="华云气象 API · 5min 推送" status="ok" />
          <InfoLine label="告警通道" value="钉钉 / 企业微信 · 电话升级" status="ok" />
          <InfoLine label="日志归档" value="ClickHouse · 保留 36 月" status="ok" />
          <InfoLine label="数字孪生" value="Unity + WebGL · V2 开发中" status="dev" />
        </Panel>
      </div>
    </div>
  );
};

const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  color: string;
  help?: string;
}> = ({ label, value, onChange, min, max, step = 1, unit, color, help }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: C.textSec, fontWeight: 600 }}>{label}</span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color,
          fontFamily: "'Courier New',monospace",
          letterSpacing: 1,
        }}
      >
        {value} <span style={{ fontSize: 10, color: C.textMut }}>{unit}</span>
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{
        width: '100%',
        accentColor: color,
        cursor: 'pointer',
      }}
    />
    {help && <div style={{ fontSize: 10, color: C.textMut, marginTop: 4 }}>{help}</div>}
  </div>
);

const InfoLine: React.FC<{ label: string; value: string; status: 'ok' | 'dev' }> = ({
  label,
  value,
  status,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 4px',
      borderBottom: `1px solid ${C.border}50`,
      fontSize: 12,
    }}
  >
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: status === 'ok' ? C.accent : C.amber,
        boxShadow: `0 0 6px ${status === 'ok' ? C.accent : C.amber}`,
      }}
    />
    <div style={{ width: 110, color: C.textSec, fontWeight: 600 }}>{label}</div>
    <div style={{ flex: 1, color: C.textMut, fontFamily: "'Courier New',monospace", fontSize: 11 }}>
      {value}
    </div>
    <div
      style={{
        fontSize: 9,
        color: status === 'ok' ? C.accent : C.amber,
        fontWeight: 700,
        padding: '2px 8px',
        background: status === 'ok' ? `${C.accent}15` : `${C.amber}15`,
        borderRadius: 10,
        textTransform: 'uppercase',
      }}
    >
      {status === 'ok' ? 'ONLINE' : 'DEV'}
    </div>
  </div>
);

export default SettingsPage;
