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
import { startEngine, getEngine } from './engine.js';
import { ApiError } from './validate.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// CORS 白名单（前端 dev + preview + prod 域名）
const ALLOWED_ORIGINS = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / curl
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  const snap = getEngine().snapshot();
  res.json({
    ok: true,
    ts: new Date().toISOString(),
    simulation: 'running',
    simTime: snap.simTime,
    simHour: snap.simHour,
    simDay: snap.simDay,
    batteries: snap.batteries.length,
  });
});

app.use('/api/dashboard', dashboard);
app.use('/api/batteries', batteries);
app.use('/api/scheduling', scheduling);
app.use('/api/alerts', alerts);
app.use('/api/drilling-plans', drillingPlans);
app.use('/api/reports', reports);
app.use('/api/map', map);
app.use('/api/uploads', uploads);

// 统一错误响应
app.use(
  (
    err: Error | ApiError,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    if (err instanceof ApiError) {
      res.status(err.status).json({ ok: false, error: err.message, details: err.details });
      return;
    }
    console.error('[server error]', err);
    res.status(500).json({ ok: false, error: err.message });
  },
);

// 启动统一模拟引擎：1 real second = 1 sim minute, 24 real minutes = 1 sim day
startEngine();

app.listen(PORT, () => {
  console.log(`[server] listening on http://127.0.0.1:${PORT}`);
  console.log(`[server] CORS allowlist: ${ALLOWED_ORIGINS.join(', ')}`);
});
