import { Router } from 'express';
import { nextEventId, nowIso, state } from '../state.js';

const r = Router();

/** GET /api/scheduling/plan — 当前 24h 调度计划 */
r.get('/plan', (_req, res) => {
  res.json({
    ok: true,
    rows: [
      {
        battery: 'α-01',
        bars: [
          { label: '供电', start: 0, end: 6, color: 'accent' },
          { label: '换电', start: 6, end: 6.25, color: 'purple' },
          { label: '运输', start: 6.25, end: 7, color: 'orange' },
          { label: '充电(谷)', start: 7, end: 10, color: 'cyan' },
          { label: '待命', start: 10.75, end: 14.25, color: 'blue' },
          { label: '供电', start: 14.5, end: 22, color: 'accent' },
        ],
      },
      {
        battery: 'β-02',
        bars: [
          { label: '待命', start: 0, end: 2.5, color: 'blue' },
          { label: '充电(深谷)', start: 3.25, end: 5.75, color: 'cyan' },
          { label: '供电', start: 6.25, end: 14.25, color: 'accent' },
          { label: '充电(平)', start: 15.25, end: 18.25, color: 'cyan' },
          { label: '待命', start: 19, end: 24, color: 'blue' },
        ],
      },
      {
        battery: 'γ-03',
        bars: [
          { label: '充电(深谷)', start: 0, end: 3, color: 'cyan' },
          { label: '待命', start: 3.75, end: 24, color: 'blue' },
        ],
      },
    ],
    optimizedAt: nowIso(),
    engine: 'MILP + LSTM + RL',
  });
});

/** POST /api/scheduling/manual — 手动调度（触发 MILP 重算） */
r.post('/manual', (req, res) => {
  const { batteryId, action, reason } = req.body ?? {};

  const evtId = nextEventId();
  state.scheduleEvents.push({
    id: evtId,
    batteryId: typeof batteryId === 'number' ? batteryId : 0,
    type: action ?? 'standby',
    start: nowIso(),
    end: nowIso(),
    source: 'manual',
    triggeredBy: '张管理员',
  });

  res.json({
    ok: true,
    eventId: evtId,
    message: '手动调度任务已下发，MILP 引擎将在 3 秒内重新优化全局调度计划',
    notes: reason ?? '人工干预',
    estimatedReoptimizeMs: 3000,
  });
});

export default r;
