import express from 'express';
import cors from 'cors';

import dashboard from './routes/dashboard.js';
import batteries from './routes/batteries.js';
import scheduling from './routes/scheduling.js';
import alerts from './routes/alerts.js';
import drillingPlans from './routes/drillingPlans.js';
import reports from './routes/reports.js';
import map from './routes/map.js';
import uploads from './routes/uploads.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api/dashboard', dashboard);
app.use('/api/batteries', batteries);
app.use('/api/scheduling', scheduling);
app.use('/api/alerts', alerts);
app.use('/api/drilling-plans', drillingPlans);
app.use('/api/reports', reports);
app.use('/api/map', map);
app.use('/api/uploads', uploads);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server error]', err);
  res.status(500).json({ ok: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`);
});
