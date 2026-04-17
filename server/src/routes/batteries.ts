import { Router } from 'express';
import { getEngine } from '../engine.js';
import { nextExportId, nowIso, state } from '../state.js';

const r = Router();

/** GET /api/batteries — 列表（从引擎实时读取） */
r.get('/', (_req, res) => {
  const snap = getEngine().snapshot();
  res.json({ ok: true, batteries: snap.batteries });
});

/** GET /api/batteries/:id — 详情 + SOC 历史 + AI 建议 */
r.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const snap = getEngine().snapshot();
  const b = snap.batteries.find(x => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  const socHistory = snap.socHistory[id] ?? [];
  const estHours = b.status === 'supplying' ? Math.max(1, Math.round(b.soc / 14)) : null;

  res.json({
    ok: true,
    battery: b,
    socHistory,
    timeline: (snap.schedule[id] ?? []).map(seg => ({
      start: seg.start,
      end: seg.end,
      status: seg.status,
      label: seg.label,
    })),
    aiAdvice: {
      summary: b.status === 'supplying'
        ? `${b.name} 当前 SOC ${Math.round(b.soc)}%，预计可继续供电约 ${estHours}h`
        : b.status === 'charging'
        ? `${b.name} 正在充电，SOC ${Math.round(b.soc)}%，预计 ${Math.round((100 - b.soc) / 33 * 60)} 分钟充满`
        : `${b.name} 当前 ${b.status}，SOC ${Math.round(b.soc)}%`,
      reasoning: [
        { k: '电池状态', v: `SOC ${Math.round(b.soc)}% · ${b.status}` },
        { k: '负荷预测', v: `当前平台负荷 ${snap.platformLoad} kW` },
        { k: '电价时段', v: `${snap.tierInfo.label} ¥${snap.tierInfo.price}/度` },
        { k: '运输窗口', v: '到河间充电站约 50 分钟' },
      ],
      nextAction: b.status === 'supplying' && b.soc < 25
        ? '即将触发换电流程'
        : b.status === 'supplying'
        ? '继续供电，暂不干预'
        : b.status === 'charging'
        ? '充满后运输返回平台'
        : '待命中',
    },
    chargeLog: snap.recentAlerts
      .filter(a => a.target.includes(b.name))
      .slice(0, 5)
      .map(a => ({
        time: a.time, type: a.title, detail: a.desc, delta: '-',
      })),
  });
});

/** POST /api/batteries/:id/swap — 立即换电 */
r.post('/:id/swap', (req, res) => {
  const id = Number(req.params.id);
  const b = state.batteries.find(x => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  const standby = state.batteries.find(x => x.status === 'standby');
  if (!standby) {
    return res.status(409).json({ ok: false, error: '当前没有备用电池可执行热切换' });
  }

  b.status = 'to_station';
  standby.status = 'supplying';
  standby.location = '钻井平台 A-01';

  res.json({
    ok: true,
    message: `已下发换电指令：${standby.name} 接管供电，${b.name} 装车返回充电站`,
    swappedFrom: b.id,
    swappedTo: standby.id,
    eta: '15 分钟',
  });
});

/** POST /api/batteries/:id/export */
r.post('/:id/export', (req, res) => {
  const id = Number(req.params.id);
  const b = state.batteries.find(x => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  const exportId = nextExportId();
  state.exportJobs.push({
    id: exportId, type: 'battery', status: 'ready',
    url: `/exports/${exportId}.xlsx`, createdAt: nowIso(),
  });
  res.json({
    ok: true,
    message: `已生成 ${b.name} 数据报表（${exportId}）`,
    exportId,
    filename: `${b.name}_data_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
});

export default r;
