import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db } from '../db';
import { authMiddleware, requireProjectMember } from '../middleware/auth';
import { addTimelineEvent } from './timeline';

export const filesRouter = Router({ mergeParams: true });
filesRouter.use(authMiddleware);

const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

function mapFile(row: Record<string, unknown>) {
  return {
    id:           row.id,
    projectId:    row.project_id,
    name:         row.name,
    size:         Number(row.size),
    mimeType:     row.mime_type,
    uploaderId:   row.uploader_id,
    storagePath:  row.storage_path,
    createdAt:    row.created_at,
  };
}

// GET /api/projects/:projectId/files
filesRouter.get('/', requireProjectMember, async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM files WHERE project_id=$1 ORDER BY created_at DESC',
    [req.params.projectId],
  );
  res.json(rows.map(mapFile));
});

// POST /api/projects/:projectId/files  (multipart)
filesRouter.post(
  '/',
  requireProjectMember,
  upload.array('files', 20),
  async (req, res) => {
    const userId = (req as any).user.id;
    const uploaded = req.files as Express.Multer.File[];
    if (!uploaded?.length) return res.status(400).json({ error: 'No files' });

    const results = [];
    for (const f of uploaded) {
      const id = uuidv4();
      await db.query(
        `INSERT INTO files (id,project_id,name,size,mime_type,uploader_id,storage_path,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [id, req.params.projectId, f.originalname, f.size,
         f.mimetype || 'application/octet-stream', userId, f.filename],
      );
      await addTimelineEvent(req.params.projectId, userId, 'file_uploaded', { fileName: f.originalname });
      const { rows: [row] } = await db.query('SELECT * FROM files WHERE id=$1', [id]);
      results.push(mapFile(row));
    }
    res.status(201).json(results);
  },
);

// GET /api/files/:fileId/download
filesRouter.get('/:fileId/download', async (req, res) => {
  const { rows: [file] } = await db.query('SELECT * FROM files WHERE id=$1', [req.params.fileId]);
  if (!file || !file.storage_path) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(UPLOAD_DIR, file.storage_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });

  res.download(filePath, file.name);
});

// DELETE /api/files/:fileId
filesRouter.delete('/:fileId', async (req, res) => {
  const { rows: [file] } = await db.query('SELECT * FROM files WHERE id=$1', [req.params.fileId]);
  if (!file) return res.status(404).json({ error: 'Not found' });

  if (file.storage_path) {
    const filePath = path.join(UPLOAD_DIR, file.storage_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  await db.query('DELETE FROM files WHERE id=$1', [req.params.fileId]);
  res.json({ ok: true });
});
