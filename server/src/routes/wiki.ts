import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware, requireProjectMember } from '../middleware/auth';

export const wikiRouter = Router({ mergeParams: true });
wikiRouter.use(authMiddleware);

// GET /api/projects/:projectId/wiki
wikiRouter.get('/', requireProjectMember, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, project_id AS "projectId", title, content, version,
            author_id AS "authorId", updated_at AS "updatedAt"
     FROM wiki_pages WHERE project_id=$1 ORDER BY updated_at DESC`,
    [req.params.projectId],
  );
  res.json(rows);
});

// POST /api/projects/:projectId/wiki
wikiRouter.post('/', requireProjectMember, async (req, res) => {
  const userId = (req as any).user.id;
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = uuidv4();
  await db.query(
    `INSERT INTO wiki_pages (id,project_id,title,content,version,author_id,updated_at)
     VALUES ($1,$2,$3,$4,1,$5,NOW())`,
    [id, req.params.projectId, title, content || '', userId],
  );
  const { rows: [row] } = await db.query(
    `SELECT id, project_id AS "projectId", title, content, version,
            author_id AS "authorId", updated_at AS "updatedAt"
     FROM wiki_pages WHERE id=$1`, [id]);
  res.status(201).json(row);
});

// PATCH /api/wiki/:id
wikiRouter.patch('/:id', async (req, res) => {
  const userId = (req as any).user.id;
  const { title, content } = req.body;
  await db.query(
    `UPDATE wiki_pages SET
       title=COALESCE($1,title),
       content=COALESCE($2,content),
       version=version+1,
       author_id=$3,
       updated_at=NOW()
     WHERE id=$4`,
    [title, content, userId, req.params.id],
  );
  const { rows: [row] } = await db.query(
    `SELECT id, project_id AS "projectId", title, content, version,
            author_id AS "authorId", updated_at AS "updatedAt"
     FROM wiki_pages WHERE id=$1`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// DELETE /api/wiki/:id
wikiRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM wiki_pages WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
