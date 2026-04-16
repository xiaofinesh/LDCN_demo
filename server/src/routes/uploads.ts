import { Router } from 'express';
import { nextExportId, nowIso, state } from '../state.js';

const r = Router();

/** POST /api/uploads — 文件上传占位（demo 不真正落盘，返回 fake id） */
r.post('/', (req, res) => {
  const filename = req.body?.filename ?? 'attachment.bin';
  const sizeKB = req.body?.sizeKB ?? Math.round(Math.random() * 800 + 50);
  const id = nextExportId();
  state.exportJobs.push({
    id, type: 'dashboard', status: 'ready',
    url: `/uploads/${id}/${filename}`, createdAt: nowIso(),
  });
  res.json({
    ok: true,
    fileId: id,
    filename,
    sizeKB,
    message: `文件 ${filename}（${sizeKB} KB）已上传，附加到当前钻井计划`,
  });
});

export default r;
