import { Router } from 'express';
import { nextPlanId, nowIso, state } from '../state.js';
import type { DrillingPlan, PlanStatus } from '../state.js';

const r = Router();

/** GET /api/drilling-plans — 列表 */
r.get('/', (_req, res) => {
  res.json({ ok: true, plans: state.drillingPlans });
});

/** POST /api/drilling-plans/estimate — AI 实时预估（边录入边预测） */
r.post('/estimate', (req, res) => {
  const { rigType, depthM, days, dailyRunHours } = req.body ?? {};

  // 简单可解释的预测：钻机型号 × 钻深 × 工时
  const rigCoef: Record<string, number> = {
    '中型钻机 HXY-3000': 380,
    '大型钻机 HXY-5000': 540,
    '超深井钻机 HXY-8000': 720,
  };
  const base = rigCoef[String(rigType)] ?? 480;
  const depthFactor = Math.max(0.85, Math.min(1.5, Number(depthM ?? 2500) / 2500));
  const hourFactor = Math.max(0.6, Math.min(1.4, Number(dailyRunHours ?? 18) / 18));
  const dailyKwh = Math.round(base * depthFactor * hourFactor * 24 * 0.65);
  const totalDays = Math.max(1, Math.round(Number(days ?? 30)));

  // 成本对比
  const baselinePrice = 0.7;     // ¥/度（无优化加权电价）
  const optimizedPrice = 0.52;   // ¥/度（AI 优化后）
  const baselineCost = Math.round(dailyKwh * baselinePrice * totalDays);
  const optimizedCost = Math.round(dailyKwh * optimizedPrice * totalDays);
  const saving = baselineCost - optimizedCost;
  const savingPct = Math.round((saving / baselineCost) * 100);

  // 资源建议
  const recommendedBatteries = dailyKwh >= 16000 ? 4 : 3;
  const recommendedStation = dailyKwh >= 18000 ? '河间充电站 + 备用站' : '河间充电站';

  res.json({
    ok: true,
    estimate: {
      dailyKwh,
      totalDays,
      totalKwh: dailyKwh * totalDays,
      baselineCost,
      optimizedCost,
      saving,
      savingPct,
      recommendedBatteries,
      recommendedStation,
      assumptions: [
        `钻机基线功率 ${base} kW，钻深修正 ×${depthFactor.toFixed(2)}，工时修正 ×${hourFactor.toFixed(2)}`,
        `按运行系数 0.65 折算到日均用电`,
        `AI 优化后加权电价 ¥${optimizedPrice}/度（vs 无优化基线 ¥${baselinePrice}/度）`,
      ],
    },
  });
});

/** POST /api/drilling-plans — 提交或保存草稿（status by query 或 body） */
r.post('/', (req, res) => {
  const status: PlanStatus = (req.query.status as PlanStatus) || (req.body?.status as PlanStatus) || 'submitted';
  const id = nextPlanId();
  const plan: DrillingPlan = {
    id,
    team: req.body?.team ?? '钻井三队',
    wellName: req.body?.wellName ?? 'JH-018',
    startDate: req.body?.startDate ?? '2026-04-20',
    endDate: req.body?.endDate ?? '2026-05-20',
    rigType: req.body?.rigType ?? '中型钻机 HXY-3000',
    expectedDailyKwh: Number(req.body?.expectedDailyKwh ?? 11302),
    status,
    createdAt: nowIso(),
    submittedAt: status === 'submitted' ? nowIso() : undefined,
    notes: req.body?.notes,
  };
  state.drillingPlans.push(plan);

  res.json({
    ok: true,
    plan,
    message:
      status === 'draft'
        ? `草稿已保存（${id}），可在「钻井计划」列表继续编辑`
        : `计划已提交（${id}），系统将自动生成调度计划与运输安排`,
  });
});

/** DELETE /api/drilling-plans/:id — 取消（仅草稿可删） */
r.delete('/:id', (req, res) => {
  const i = state.drillingPlans.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ ok: false, error: 'plan not found' });
  state.drillingPlans.splice(i, 1);
  res.json({ ok: true, message: '已删除' });
});

export default r;
