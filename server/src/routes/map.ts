import { Router } from 'express';
import { state } from '../state.js';

const r = Router();

/** GET /api/map/layer — 当前地图图层偏好 */
r.get('/layer', (_req, res) => {
  res.json({ ok: true, layer: state.mapLayer.layer });
});

/** POST /api/map/layer — 切换地图图层 */
r.post('/layer', (req, res) => {
  const layer = req.body?.layer;
  if (!['satellite', 'road', 'label'].includes(layer)) {
    return res.status(400).json({ ok: false, error: 'invalid layer' });
  }
  state.mapLayer.layer = layer;
  res.json({ ok: true, layer });
});

export default r;
