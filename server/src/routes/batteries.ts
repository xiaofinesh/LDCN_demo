import { Router } from 'express';
import { nextExportId, nowIso, state } from '../state.js';

const r = Router();

/** GET /api/batteries — 列表 */
r.get('/', (_req, res) => {
  res.json({ ok: true, batteries: state.batteries });
});

/** GET /api/batteries/:id — 详情（含 SOC 历史 + AI 建议 + 充放电流水） */
r.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const b = state.batteries.find((x) => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  // 24h 历史 SOC（按当前 SOC 反推一条曲线）
  const socHistory = Array.from({ length: 24 }, (_, h) => {
    const phase = (h - 14 + 24) % 24;
    const v = phase < 6 ? 100 - phase * 14 : phase < 12 ? 16 + (phase - 6) * 14 : 100 - (phase - 12) * 4;
    return { hour: h, soc: Math.max(8, Math.min(100, Math.round(v))) };
  });

  res.json({
    ok: true,
    battery: b,
    timeline: [
      { time: '06:00', type: '换电', detail: '换出 SOC 8% · 接管供电', status: '完成' },
      { time: '07:00', type: '充电开始', detail: '河间充电站 · 平段 ¥0.6642/度', status: '完成' },
      { time: '10:30', type: '充电完成', detail: 'SOC 100% · 待运输', status: '完成' },
      { time: '11:15', type: '运输', detail: '充电站 → 钻井平台 A-01', status: '完成' },
      { time: '14:30', type: '换电', detail: '接管供电 · 当前供电中', status: '进行中' },
    ],
    socHistory,
    aiAdvice: {
      summary: `当前 ${b.name} SOC ${b.soc}%，${b.status === 'supplying' ? '可继续供电 3.5h，无需提前换电' : '建议在低谷电价时段开始充电'}`,
      reasoning: [
        { k: '电池状态', v: `当前 SOC ${b.soc}%，预计可继续供电 ${Math.max(1, Math.round(b.soc / 20))} 小时` },
        { k: '负荷预测', v: 'LSTM 预测未来 4h 平均功率 720 kW，SOC 下降率约 14.5%/h' },
        { k: '运输窗口', v: '到河间充电站约 50 分钟，符合时间约束' },
        { k: '电价时段', v: '17:00-21:00 高峰 ¥0.94/度，建议错峰充电' },
      ],
      nextAction: b.status === 'supplying' ? '17:30 触发换电流程，由 β-02 接管' : '03:00 开始充电至 100%（深谷电价）',
    },
    chargeLog: [
      { time: '04-15 22:30', type: '充电', detail: '深谷 ¥0.367 × 5,000 kWh = ¥1,835', delta: '+82%' },
      { time: '04-16 03:25', type: '充电完成', detail: '本次充电节省 ¥1,650（vs 高峰）', delta: '+18%' },
      { time: '04-16 06:15', type: '换电', detail: '由本电池接管 A-01 平台供电', delta: '-' },
      { time: '04-16 14:30', type: '换电', detail: '本电池继续供电（轮换中）', delta: '-' },
    ],
  });
});

/** POST /api/batteries/:id/swap — 立即换电 */
r.post('/:id/swap', (req, res) => {
  const id = Number(req.params.id);
  const b = state.batteries.find((x) => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  const standby = state.batteries.find((x) => x.status === 'standby');
  if (!standby) {
    return res.status(409).json({
      ok: false,
      error: '当前没有备用电池可执行热切换',
    });
  }
  // 模拟切换
  b.status = 'to_station';
  standby.status = 'supplying';
  standby.location = b.location;

  res.json({
    ok: true,
    message: `已下发换电指令：${standby.name} 接管 ${b.location} 供电，${b.name} 装车返回充电站`,
    swappedFrom: b.id,
    swappedTo: standby.id,
    eta: '15 分钟',
  });
});

/** POST /api/batteries/:id/export — 导出该电池数据 */
r.post('/:id/export', (req, res) => {
  const id = Number(req.params.id);
  const b = state.batteries.find((x) => x.id === id);
  if (!b) return res.status(404).json({ ok: false, error: 'battery not found' });

  const exportId = nextExportId();
  state.exportJobs.push({
    id: exportId, type: 'battery', status: 'ready',
    url: `/exports/${exportId}.xlsx`,
    createdAt: nowIso(),
  });
  res.json({
    ok: true,
    message: `已生成 ${b.name} 数据报表（${exportId}）`,
    exportId,
    filename: `${b.name}_data_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
});

export default r;
