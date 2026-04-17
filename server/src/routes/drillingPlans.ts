import { Router } from 'express';
import { z } from 'zod';
import { nextPlanId, nowIso, state } from '../state.js';
import type { DrillingPlan, PlanStatus } from '../state.js';
import { validateBody } from '../validate.js';

const r = Router();

/** GET /api/drilling-plans — 列表 */
r.get('/', (_req, res) => {
  res.json({ ok: true, plans: state.drillingPlans });
});

/** POST /api/drilling-plans/estimate — AI 实时预估 */
const estimateSchema = z.object({
  rigType: z.string().min(1).max(80).optional(),
  depthM: z.number().positive().max(20000).optional(),
  days: z.number().int().positive().max(365).optional(),
  dailyRunHours: z.number().positive().max(24).optional(),
});

r.post('/estimate', validateBody(estimateSchema), (req, res) => {
  const { rigType, depthM, days, dailyRunHours } = req.body as z.infer<typeof estimateSchema>;

  const rigCoef: Record<string, number> = {
    '中型钻机 HXY-3000': 380,
    '大型钻机 HXY-5000': 540,
    '超深井钻机 HXY-8000': 720,
    'ZJ40 (4000米钻机)': 480,
  };
  const base = rigCoef[rigType ?? ''] ?? 480;
  const depthFactor = Math.max(0.85, Math.min(1.5, (depthM ?? 2500) / 2500));
  const hourFactor = Math.max(0.6, Math.min(1.4, (dailyRunHours ?? 18) / 18));
  const dailyKwh = Math.round(base * depthFactor * hourFactor * 24 * 0.65);
  const totalDays = Math.max(1, days ?? 30);

  const baselinePrice = 0.7;
  const optimizedPrice = 0.52;
  const baselineCost = Math.round(dailyKwh * baselinePrice * totalDays);
  const optimizedCost = Math.round(dailyKwh * optimizedPrice * totalDays);
  const saving = baselineCost - optimizedCost;
  const savingPct = Math.round((saving / baselineCost) * 100);

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

/** POST /api/drilling-plans — 提交或保存草稿 */
const planSchema = z.object({
  team: z.string().max(80).optional(),
  wellName: z.string().max(80).optional(),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional(),
  rigType: z.string().max(80).optional(),
  expectedDailyKwh: z.number().nonnegative().max(1_000_000).optional(),
  notes: z.string().max(2000).optional(),
});

const planStatusQuery = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'executing', 'completed']).optional(),
});

r.post('/', validateBody(planSchema), (req, res, next) => {
  const q = planStatusQuery.safeParse(req.query);
  if (!q.success) return next(new Error('invalid status'));
  const status: PlanStatus = q.data.status ?? 'submitted';
  const body = req.body as z.infer<typeof planSchema>;
  const id = nextPlanId();
  const plan: DrillingPlan = {
    id,
    team: body.team ?? '钻井三队',
    wellName: body.wellName ?? 'JH-018',
    startDate: body.startDate ?? '2026-04-20',
    endDate: body.endDate ?? '2026-05-20',
    rigType: body.rigType ?? '中型钻机 HXY-3000',
    expectedDailyKwh: body.expectedDailyKwh ?? 11302,
    status,
    createdAt: nowIso(),
    submittedAt: status === 'submitted' ? nowIso() : undefined,
    notes: body.notes,
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

/** DELETE /api/drilling-plans/:id */
r.delete('/:id', (req, res) => {
  const i = state.drillingPlans.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ ok: false, error: 'plan not found' });
  state.drillingPlans.splice(i, 1);
  res.json({ ok: true, message: '已删除' });
});

export default r;
