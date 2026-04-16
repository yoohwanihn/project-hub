import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware, requireProjectMember } from '../middleware/auth';

export const announcementsRouter = Router({ mergeParams: true });
announcementsRouter.use(authMiddleware);

// GET /api/projects/:projectId/announcements
announcementsRouter.get('/', requireProjectMember, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, project_id AS "projectId", title, content,
            author_id AS "authorId", is_pinned AS "isPinned",
            created_at AS "createdAt"
     FROM announcements WHERE project_id=$1
     ORDER BY is_pinned DESC, created_at DESC`,
    [req.params.projectId],
  );
  res.json(rows);
});

// POST /api/projects/:projectId/announcements
announcementsRouter.post('/', requireProjectMember, async (req, res) => {
  const userId = req.user!.sub;
  const { title, content, isPinned } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = uuidv4();
  await db.query(
    `INSERT INTO announcements (id,project_id,title,content,author_id,is_pinned,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
    [id, req.params.projectId, title, content || '', userId, isPinned ?? false],
  );
  const { rows: [row] } = await db.query(
    `SELECT id, project_id AS "projectId", title, content,
            author_id AS "authorId", is_pinned AS "isPinned", created_at AS "createdAt"
     FROM announcements WHERE id=$1`, [id]);
  res.status(201).json(row);
});

// PATCH /api/announcements/:id
announcementsRouter.patch('/:id', async (req, res) => {
  const { title, content, isPinned } = req.body;
  await db.query(
    `UPDATE announcements SET
       title=COALESCE($1,title),
       content=COALESCE($2,content),
       is_pinned=COALESCE($3,is_pinned)
     WHERE id=$4`,
    [title, content, isPinned, req.params.id],
  );
  const { rows: [row] } = await db.query(
    `SELECT id, project_id AS "projectId", title, content,
            author_id AS "authorId", is_pinned AS "isPinned", created_at AS "createdAt"
     FROM announcements WHERE id=$1`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// DELETE /api/announcements/:id
announcementsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
