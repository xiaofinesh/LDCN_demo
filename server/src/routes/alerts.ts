import { Router } from 'express';
import { nextExportId, nowIso, state } from '../state.js';

const r = Router();

/** GET /api/alerts — 列表（支持 ?level= ?status=） */
r.get('/', (req, res) => {
  const { level, status } = req.query;
  let list = state.alerts;
  if (level && level !== 'all') list = list.filter((a) => a.level === level);
  if (status && status !== 'all') {
    if (status === 'active') list = list.filter((a) => a.status === 'processing');
    if (status === 'resolved') list = list.filter((a) => a.status === 'resolved');
  }
  res.json({
    ok: true,
    alerts: list,
    counts: {
      total: state.alerts.length,
      red: state.alerts.filter((a) => a.level === 'red').length,
      orange: state.alerts.filter((a) => a.level === 'orange').length,
      yellow: state.alerts.filter((a) => a.level === 'yellow').length,
      blue: state.alerts.filter((a) => a.level === 'blue').length,
      processing: state.alerts.filter((a) => a.status === 'processing').length,
      resolved: state.alerts.filter((a) => a.status === 'resolved').length,
    },
  });
});

/** GET /api/alerts/:id — 单条详情 */
r.get('/:id', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  res.json({ ok: true, alert: a });
});

/** POST /api/alerts/:id/actions/:action — 执行内置 action（启动应急运输 等） */
r.post('/:id/actions/:action', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  const action = req.params.action;
  a.notes.push(`${nowIso()}: 执行处置「${action}」`);
  res.json({
    ok: true,
    message: `${a.id} 已执行处置：${action}`,
    nextStep: '正在调度对应资源，预计 3 分钟内有反馈',
  });
});

/** POST /api/alerts/:id/call — 呼叫现场 */
r.post('/:id/call', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  a.callLog = [...(a.callLog ?? []), `${nowIso()}: 拨打现场负责人`];
  res.json({
    ok: true,
    message: `已通过电话/短信通知现场负责人（13800138000）`,
    callId: `CALL-${Date.now()}`,
  });
});

/** POST /api/alerts/:id/emergency — 启动应急预案 */
r.post('/:id/emergency', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  a.emergencyTriggered = true;
  a.notes.push(`${nowIso()}: 启动应急预案 E-01`);
  res.json({
    ok: true,
    message: '应急预案 E-01 已启动：备用电池调度 + 充电站协调 + 现场运维通知',
    planId: 'E-01',
  });
});

/** POST /api/alerts/:id/transfer — 转派他人 */
r.post('/:id/transfer', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  const to = (req.body?.to as string) || '李调度员';
  a.transferredTo = to;
  a.handler = to;
  a.status = 'transferred';
  res.json({ ok: true, message: `已转派给 ${to}` });
});

/** POST /api/alerts/:id/note — 添加备注 */
r.post('/:id/note', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  const text = (req.body?.text as string) || '';
  if (!text) return res.status(400).json({ ok: false, error: 'note text required' });
  a.notes.push(`${nowIso()}: ${text}`);
  res.json({ ok: true, message: '备注已添加', notes: a.notes });
});

/** POST /api/alerts/:id/resolve — 标记为已处置 */
r.post('/:id/resolve', (req, res) => {
  const a = state.alerts.find((x) => x.id === req.params.id);
  if (!a) return res.status(404).json({ ok: false, error: 'alert not found' });
  a.status = 'resolved';
  a.resolvedAt = nowIso();
  res.json({ ok: true, message: '告警已标记为已处置', resolvedAt: a.resolvedAt });
});

/** POST /api/alerts/export — 导出告警日志 */
r.post('/export', (_req, res) => {
  const exportId = nextExportId();
  state.exportJobs.push({
    id: exportId, type: 'alert', status: 'ready',
    url: `/exports/${exportId}.csv`,
    createdAt: nowIso(),
  });
  res.json({ ok: true, exportId, filename: `alerts_${new Date().toISOString().slice(0, 10)}.csv`, rows: state.alerts.length });
});

/** GET /api/alerts/rules/list — 告警规则配置（演示） */
r.get('/rules/list', (_req, res) => {
  res.json({
    ok: true,
    rules: [
      { id: 'R-01', level: 'red',    cond: '在用电池 SOC < 15% 且无备用电池就位', notify: '电话+短信+App' },
      { id: 'R-02', level: 'orange', cond: 'LSTM 预测 2h 内需换电但备用未就位',   notify: '短信+App' },
      { id: 'R-03', level: 'orange', cond: '充电功率持续 5 min 低于额定 90%',     notify: 'App' },
      { id: 'R-04', level: 'yellow', cond: '运输车辆延迟超过 10 min',             notify: 'App' },
      { id: 'R-05', level: 'blue',   cond: '调度计划自动重算',                    notify: 'App' },
    ],
  });
});

export default r;
