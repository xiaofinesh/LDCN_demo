import { Router } from 'express';
import { nextExportId, nowIso, state } from '../state.js';

const r = Router();

type Range = 'day' | 'week' | 'month' | 'quarter' | 'year';

const SAVING_BY_RANGE: Record<Range, { saved: number; baseline: number; optimized: number; days: number }> = {
  day:     { saved: 1582,    baseline: 7911,     optimized: 6329,    days: 1 },
  week:    { saved: 11074,   baseline: 55377,    optimized: 44303,   days: 7 },
  month:   { saved: 47460,   baseline: 237330,   optimized: 189870,  days: 30 },
  quarter: { saved: 142380,  baseline: 711990,   optimized: 569610,  days: 90 },
  year:    { saved: 474600,  baseline: 2373300,  optimized: 1898700, days: 300 },
};

/** GET /api/reports/savings?range= */
r.get('/savings', (req, res) => {
  const range = (String(req.query.range ?? 'month') as Range);
  const data = SAVING_BY_RANGE[range] ?? SAVING_BY_RANGE.month;
  const savingPct = Math.round((data.saved / data.baseline) * 1000) / 10;

  // 14 日逐日节约（演示）
  const dailyHistory = [1620, 1480, 1700, 1390, 1810, 1560, 1640, 1520, 1450, 1730, 1670, 1580, 1710, 1582].map(
    (s, i) => ({
      day: `D${i + 1}`,
      saved: s,
      pct: 18 + (i % 5),
    }),
  );

  res.json({
    ok: true,
    range,
    summary: {
      saved: data.saved,
      baseline: data.baseline,
      optimized: data.optimized,
      savingPct,
      days: data.days,
      annualizedSaving: Math.round(data.saved / data.days * 300),
    },
    tierDistribution: [
      { k: 'peak',       label: '尖峰', actual: 4,  baseline: 22 },
      { k: 'high',       label: '高峰', actual: 8,  baseline: 28 },
      { k: 'flat',       label: '平段', actual: 18, baseline: 30 },
      { k: 'valley',     label: '低谷', actual: 32, baseline: 12 },
      { k: 'deepValley', label: '深谷', actual: 38, baseline: 8  },
    ],
    dailyHistory,
    scenarios: [
      { k: 'conservative', label: '保守',  pct: 15, annual: 356000 },
      { k: 'neutral',      label: '中性',  pct: 20, annual: 475000 },
      { k: 'actual',       label: '实际',  pct: savingPct, annual: Math.round(data.saved / data.days * 300) },
      { k: 'optimistic',   label: '乐观',  pct: 25, annual: 593000 },
    ],
    optimizationRoom: {
      currentPct: savingPct,
      maxTheoreticalPct: 52,
      utilization: Math.round((savingPct / 52) * 100),
      tip: '当前节省已达理论最大值 38.7%。建议增加第 4 块备用电池可再提升约 6%。',
    },
  });
});

/** POST /api/reports/export — 导出 Excel 报表 */
r.post('/export', (_req, res) => {
  const exportId = nextExportId();
  state.exportJobs.push({
    id: exportId, type: 'dashboard', status: 'ready',
    url: `/exports/${exportId}.xlsx`, createdAt: nowIso(),
  });
  res.json({
    ok: true,
    exportId,
    filename: `dashboard_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    message: '报表已生成，正在下载…',
  });
});

/** POST /api/reports/pdf — 导出 PDF（电价分析） */
r.post('/pdf', (_req, res) => {
  const exportId = nextExportId();
  state.exportJobs.push({
    id: exportId, type: 'pricing-pdf', status: 'ready',
    url: `/exports/${exportId}.pdf`, createdAt: nowIso(),
  });
  res.json({
    ok: true,
    exportId,
    filename: `pricing_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    message: 'PDF 已生成，正在下载…',
  });
});

export default r;
