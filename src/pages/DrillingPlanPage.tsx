import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { C, FONT_MONO, FONT_SANS } from '../constants/tokens';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

// ── Form components ──

interface FormLabelProps {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ children, required, hint }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8,
  }}>
    <label style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>
      {children} {required && <span style={{ color: C.red }}>*</span>}
    </label>
    {hint && (
      <span style={{ fontSize: 11, color: C.textMut }}>{hint}</span>
    )}
  </div>
);

interface FormFieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, hint, children, fullWidth }) => (
  <div style={{ marginBottom: 18, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
    <FormLabel required={required} hint={hint}>{label}</FormLabel>
    {children}
  </div>
);

interface InputProps {
  value?: string;
  placeholder?: string;
  suffix?: string;
}

const Input: React.FC<InputProps> = ({ value, placeholder, suffix }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 7, padding: '0 14px', height: 42,
    transition: 'border-color 0.15s',
  }}>
    <input
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      style={{
        flex: 1, border: 'none', outline: 'none',
        fontSize: 14, color: C.text, fontFamily: FONT_SANS,
        background: 'transparent',
      }}
    />
    {suffix && (
      <span style={{ fontSize: 12, color: C.textMut, marginLeft: 8, fontWeight: 600 }}>{suffix}</span>
    )}
  </div>
);

interface SelectProps {
  value?: string;
  options?: string[];
}

const Select: React.FC<SelectProps> = ({ value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 7, padding: '0 14px', height: 42,
    cursor: 'pointer',
  }}>
    <span style={{ fontSize: 14, color: value ? C.text : C.textMut, fontWeight: value ? 600 : 400 }}>
      {value || '请选择'}
    </span>
    <span style={{ color: C.textMut, fontSize: 12 }}>▼</span>
  </div>
);

interface DatePickerFieldProps {
  value: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 7, padding: '0 14px', height: 42,
    cursor: 'pointer',
  }}>
    <span style={{ fontSize: 14, color: C.text, fontFamily: FONT_MONO, fontWeight: 600 }}>{value}</span>
    <span style={{ fontSize: 14 }}>📅</span>
  </div>
);

// ── Time slot selector ──
const TIME_SLOTS: string[] = [
  '00:00-04:00', '04:00-08:00', '08:00-12:00',
  '12:00-16:00', '16:00-20:00', '20:00-24:00',
];

interface TimeSlotSelectorProps {
  selected: number[];
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ selected }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
    {TIME_SLOTS.map((slot, i) => {
      const isSelected = selected.includes(i);
      return (
        <div key={slot} style={{
          padding: '10px 8px', borderRadius: 7, cursor: 'pointer',
          textAlign: 'center', fontSize: 12, fontWeight: 700,
          background: isSelected ? C.accent : C.bgCard,
          color: isSelected ? '#fff' : C.textSec,
          border: `1px solid ${isSelected ? C.accent : C.border}`,
          fontFamily: FONT_MONO,
          transition: 'all 0.15s',
        }}>
          {slot}
        </div>
      );
    })}
  </div>
);

// ── Map location picker ──
const LocationPicker: React.FC = () => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 8,
  }}>
    <Input value="116.1428" placeholder="经度" />
    <Input value="38.7256" placeholder="纬度" />
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.accent, color: '#fff',
      borderRadius: 7, cursor: 'pointer',
      fontSize: 13, fontWeight: 700, gap: 6,
    }}>
      📍 地图选点
    </div>
  </div>
);

// ── AI Preview Panel (right side) ──
const AIPreview: React.FC = () => {
  const resourceRows: Array<[string, string]> = [
    ['所需电池数量', '3 块 + 1 备用'],
    ['主充电站', '河间充电站'],
    ['单日充电趟次', '≈ 2-3 次'],
    ['运输总里程', '≈ 180 km/天'],
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
      border: `2px solid ${C.accent}`,
      borderRadius: 12, padding: '20px 22px',
      boxShadow: '0 4px 16px rgba(13,155,108,0.15)',
      position: 'sticky', top: 84,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, color: '#fff', fontWeight: 900,
        }}>🤖</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>AI 实时预估</div>
          <div style={{ fontSize: 11, color: C.textSec }}>根据您的填写自动分析</div>
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ marginTop: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textSec, fontWeight: 600 }}>信息完整度</span>
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 800, fontFamily: FONT_MONO }}>85%</span>
        </div>
        <div style={{ height: 6, background: '#fff', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: '85%', height: '100%', background: C.accent, borderRadius: 3 }} />
        </div>
      </div>

      {/* Predicted energy */}
      <div style={{
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 6, fontWeight: 700 }}>
          📊 预测日均用电量
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: 26, fontWeight: 900, color: C.text,
            fontFamily: FONT_MONO, letterSpacing: -0.5,
          }}>12,400</span>
          <span style={{ fontSize: 12, color: C.textMut, fontWeight: 500 }}>kWh/日</span>
        </div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>
          基于 LSTM 模型预测 · 置信区间 ±8%
        </div>

        {/* Mini load curve */}
        <svg viewBox="0 0 240 50" style={{ width: '100%', height: 50, marginTop: 10 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity="0.4" />
              <stop offset="100%" stopColor={C.accent} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[0, 25, 50].map(y => (
            <line key={y} x1="0" y1={y} x2="240" y2={y} stroke={C.divider} strokeWidth="0.5" />
          ))}
          {/* Curve */}
          <path
            d="M 0 35 L 20 38 L 40 40 L 60 30 L 80 18 L 100 12 L 120 10 L 140 12 L 160 14 L 180 18 L 200 24 L 220 30 L 240 35"
            stroke={C.accent} strokeWidth="2" fill="none"
          />
          <path
            d="M 0 35 L 20 38 L 40 40 L 60 30 L 80 18 L 100 12 L 120 10 L 140 12 L 160 14 L 180 18 L 200 24 L 220 30 L 240 35 L 240 50 L 0 50 Z"
            fill="url(#loadGrad)"
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.textMut, marginTop: -2, fontFamily: FONT_MONO }}>
          <span>00:00</span><span>12:00</span><span>24:00</span>
        </div>
      </div>

      {/* Resource allocation */}
      <div style={{
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 10, fontWeight: 700 }}>
          🔋 推荐资源配置
        </div>
        {resourceRows.map(([k, v]) => (
          <div key={k} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '6px 0', borderBottom: `1px dashed ${C.divider}`,
          }}>
            <span style={{ fontSize: 12, color: C.textSec }}>{k}</span>
            <span style={{ fontSize: 12, color: C.text, fontWeight: 700, fontFamily: FONT_MONO }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Cost estimation */}
      <div style={{
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 10, fontWeight: 700 }}>
          💰 预估充电成本
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.textSec }}>AI 优化后</span>
          <span style={{
            fontSize: 18, fontWeight: 900, color: C.accent,
            fontFamily: FONT_MONO,
          }}>¥ 6,820<span style={{ fontSize: 10, color: C.textMut, marginLeft: 4 }}>/日</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.textMut, textDecoration: 'line-through' }}>无优化基准</span>
          <span style={{
            fontSize: 14, fontWeight: 700, color: C.textMut,
            fontFamily: FONT_MONO, textDecoration: 'line-through',
          }}>¥ 8,680<span style={{ fontSize: 10, marginLeft: 4 }}>/日</span></span>
        </div>
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: C.accentLight, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>预计节省</span>
          <span style={{
            fontSize: 14, fontWeight: 900, color: C.accent,
            fontFamily: FONT_MONO,
          }}>¥ 1,860/日 · 21.4%</span>
        </div>
      </div>

      {/* Scheduling strategy */}
      <div style={{
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 10, fontWeight: 700 }}>
          ⚙️ 调度策略建议
        </div>
        <div style={{
          fontSize: 11, color: C.textSec, lineHeight: 1.6,
          paddingLeft: 10, borderLeft: `2px solid ${C.accent}`,
        }}>
          • 主要充电时段安排在深谷 (0-4h) 和低谷 (4-7h)<br />
          • 高峰时段 (16-22h) 避免充电<br />
          • 建议保留 1 块备用电池以应对负荷波动
        </div>
      </div>
    </div>
  );
};

// ── Main Form Page ──
interface EstimateResult {
  dailyKwh: number;
  totalDays: number;
  totalKwh: number;
  baselineCost: number;
  optimizedCost: number;
  saving: number;
  savingPct: number;
  recommendedBatteries: number;
  recommendedStation: string;
  assumptions: string[];
}

const DrillingPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResult | null>(null);
  const [rigType, setRigType] = useState('中型钻机 HXY-3000');
  const [depthM, setDepthM] = useState(2500);
  const [days, setDays] = useState(30);
  const [hours, setHours] = useState(18);

  // 初次加载 + 参数变化时拉取估算
  useEffect(() => {
    const t = setTimeout(() => {
      api.post<{ estimate: EstimateResult }>('/api/drilling-plans/estimate', {
        rigType, depthM, days, dailyRunHours: hours,
      })
        .then((r) => setEstimate(r.estimate))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [rigType, depthM, days, hours]);

  const submitPlan = async (status: 'draft' | 'submitted') => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ plan: { id: string }; message: string }>(
        `/api/drilling-plans?status=${status}`,
        {
          team: '钻井三队', wellName: 'JH-018',
          rigType, expectedDailyKwh: estimate?.dailyKwh ?? 11302,
        },
      );
      toast.success(`${r.message}`);
      if (status === 'submitted') navigate('/');
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const onSelectFile = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post<{ filename: string; sizeKB: number; message: string }>(
        '/api/uploads', { filename: '钻井合同附件_JH-018.pdf', sizeKB: 256 },
      );
      toast.success(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };
  void rigType; void setRigType; void depthM; void setDepthM;
  void days; void setDays; void hours; void setHours; void estimate;
  // Reserved for future interactivity; ensures useState import is used.
  const [selectedTimeSlots] = useState<number[]>([2, 3, 4]);

  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: '100vh',
      fontFamily: FONT_SANS,
    }}>
      {/* Content */}
      <div style={{ padding: '24px 28px', maxWidth: 1480, margin: '0 auto' }}>
        {/* Breadcrumb + title */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMut, marginBottom: 10 }}>
            <span style={{ cursor: 'pointer' }}>钻井队</span>
            <span>›</span>
            <span style={{ cursor: 'pointer' }}>钻井计划</span>
            <span>›</span>
            <span style={{ color: C.text, fontWeight: 600 }}>新增钻井计划</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: -0.3 }}>
                新增钻井计划
              </h1>
              <p style={{ fontSize: 13, color: C.textSec, margin: '6px 0 0 0' }}>
                与油田客户沟通对接后，由贵方调度员统一录入；系统将自动预估用电需求并生成最优调度方案
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate(-1)} disabled={busy} style={{
                fontSize: 13, padding: '10px 18px', borderRadius: 7,
                background: C.bgCard, color: C.textSec,
                border: `1px solid ${C.border}`, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                fontFamily: 'inherit',
              }}>取消</button>
              <button onClick={() => submitPlan('draft')} disabled={busy} style={{
                fontSize: 13, padding: '10px 18px', borderRadius: 7,
                background: C.bgCard, color: C.accent,
                border: `1px solid ${C.accent}`, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                fontFamily: 'inherit',
              }}>保存草稿</button>
              <button onClick={() => submitPlan('submitted')} disabled={busy} style={{
                fontSize: 13, padding: '10px 22px', borderRadius: 7,
                background: C.accent, color: '#fff',
                cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                boxShadow: `0 2px 6px ${C.accent}40`,
                border: 'none', fontFamily: 'inherit',
              }}>✓ 提交计划</button>
            </div>
          </div>
        </div>

        {/* 2-column layout: Form (left) + AI Preview (right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          {/* Left: Form */}
          <div style={{
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          }}>
            {/* Section 1: 钻井队信息 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>1</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  钻井队信息
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <FormField label="所属油田公司" required>
                  <Select value="中国石油 · 华北油田分公司" />
                </FormField>
                <FormField label="钻井队" required>
                  <Select value="钻井一队（JH-01）" />
                </FormField>

                <FormField label="井位编号" required hint="如 JH-018">
                  <Input value="JH-018" placeholder="请输入井位编号" />
                </FormField>
                <FormField label="井位名称">
                  <Input value="任丘北 18 号井" placeholder="请输入井位名称" />
                </FormField>

                <FormField label="井位位置（经纬度）" required hint="可从地图选点" fullWidth>
                  <LocationPicker />
                </FormField>
              </div>
            </div>

            {/* Section 2: 时间计划 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>2</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  时间计划
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                <FormField label="计划开钻时间" required>
                  <DatePickerField value="2026-04-24 08:00" />
                </FormField>
                <FormField label="预计完钻时间" required>
                  <DatePickerField value="2026-05-08 18:00" />
                </FormField>
                <FormField label="连续工作天数" hint="自动计算">
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: C.bgSubtle,
                    border: `1px solid ${C.border}`,
                    borderRadius: 7, padding: '0 14px', height: 42,
                  }}>
                    <span style={{ fontSize: 20, color: C.accent, fontFamily: FONT_MONO, fontWeight: 800 }}>15</span>
                    <span style={{ fontSize: 12, color: C.textMut, marginLeft: 8 }}>天</span>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Section 3: 钻机参数 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>3</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  钻机参数与用电预估
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <FormField label="钻机型号" required>
                  <Select value="ZJ40 (4000米钻机)" />
                </FormField>
                <FormField label="预估钻井深度" required>
                  <Input value="3,200" placeholder="深度数值" suffix="米" />
                </FormField>

                <FormField label="额定功率" hint="钻机铭牌功率">
                  <Input value="40,000" placeholder="0" suffix="kW" />
                </FormField>
                <FormField label="预估日均用电量" hint="AI 可自动预估">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ flex: 1 }}>
                      <Input value="12,400" placeholder="0" suffix="kWh" />
                    </div>
                    <span style={{
                      fontSize: 12, padding: '10px 14px', borderRadius: 7,
                      background: C.accentLight, color: C.accent,
                      cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
                    }}>🤖 AI 预估</span>
                  </div>
                </FormField>
              </div>

              <FormField label="主要用电时段" hint="选择钻机高功率工作的时段（可多选）" required>
                <TimeSlotSelector selected={selectedTimeSlots} />
              </FormField>
            </div>

            {/* Section 4: 备注 */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: C.accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                }}>4</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                  补充信息
                </h3>
              </div>

              <FormField label="备注说明" hint="如特殊工况、停工计划等">
                <textarea
                  defaultValue="本井位为重点开发井，4月26日-28日需配合工艺试验，用电量可能出现 20% 波动。"
                  style={{
                    width: '100%', minHeight: 80,
                    border: `1px solid ${C.border}`, borderRadius: 7,
                    padding: '12px 14px', fontSize: 14,
                    color: C.text, fontFamily: FONT_SANS,
                    resize: 'vertical', outline: 'none',
                  }}
                />
              </FormField>

              {/* Attachment */}
              <div style={{
                marginTop: 8, padding: '14px 18px',
                background: C.bgSubtle, border: `2px dashed ${C.border}`,
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>📎</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginBottom: 2 }}>
                    上传相关文档（可选）
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec }}>
                    钻井设计文件、用电申请书等 · 支持 PDF/Word/Excel · 单文件 ≤ 20MB
                  </div>
                </div>
                <button onClick={onSelectFile} disabled={busy} style={{
                  fontSize: 12, padding: '8px 16px', borderRadius: 6,
                  background: C.bgCard, color: C.textSec,
                  border: `1px solid ${C.border}`, cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                  fontFamily: 'inherit',
                }}>选择文件</button>
              </div>
            </div>
          </div>

          {/* Right: AI Preview */}
          <AIPreview />
        </div>
      </div>
    </div>
  );
};

export default DrillingPlanPage;
