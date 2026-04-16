import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware, requireProjectRole } from '../middleware/auth';
import { addTimelineEvent } from './timeline';

export const projectsRouter = Router();
projectsRouter.use(authMiddleware);

// ── helpers ──────────────────────────────────────────────────────
async function fetchFullProject(projectId: string) {
  const { rows: [project] } = await db.query(
    `SELECT id, name, description, color,
            to_char(start_date,'YYYY-MM-DD') AS "startDate",
            to_char(end_date,'YYYY-MM-DD')   AS "endDate",
            created_at AS "createdAt", updated_at AS "updatedAt"
     FROM projects WHERE id=$1`,
    [projectId],
  );
  if (!project) return null;

  const { rows: members } = await db.query(
    `SELECT u.id, u.name, u.email, u.avatar, pm.role
     FROM project_members pm JOIN users u ON u.id=pm.user_id
     WHERE pm.project_id=$1`,
    [projectId],
  );

  const { rows: workflow } = await db.query(
    `SELECT id, label, color, "order" FROM workflow_statuses
     WHERE project_id=$1 ORDER BY "order"`,
    [projectId],
  );

  const { rows: tags } = await db.query(
    `SELECT id, name, color FROM tags WHERE project_id=$1`,
    [projectId],
  );

  return { ...project, members, workflow, tags };
}

// GET /api/projects
projectsRouter.get('/', async (req, res) => {
  const userId = (req as any).user.id;
  const { rows } = await db.query(
    `SELECT DISTINCT p.id FROM projects p
     JOIN project_members pm ON pm.project_id=p.id
     WHERE pm.user_id=$1
     ORDER BY p.id`,
    [userId],
  );
  const projects = await Promise.all(rows.map((r) => fetchFullProject(r.id)));
  res.json(projects.filter(Boolean));
});

// POST /api/projects
projectsRouter.post('/', async (req, res) => {
  const userId = (req as any).user.id;
  const { name, description, color, startDate, endDate } = req.body;
  if (!name || !color) return res.status(400).json({ error: 'name and color required' });

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO projects (id,name,description,color,start_date,end_date,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
    [id, name, description || '', color, startDate || null, endDate || null, now],
  );

  // creator becomes owner
  await db.query(
    `INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,'owner')`,
    [id, userId],
  );

  // default workflow
  const defaultWf = [
    { id: `${id}-todo`,        label: '진행 전', color: '#94a3b8', order: 0 },
    { id: `${id}-in_progress`, label: '진행 중', color: '#3b82f6', order: 1 },
    { id: `${id}-review`,      label: '검토 중', color: '#f59e0b', order: 2 },
    { id: `${id}-done`,        label: '완료',    color: '#10b981', order: 3 },
  ];
  for (const w of defaultWf) {
    await db.query(
      `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5)`,
      [w.id, id, w.label, w.color, w.order],
    );
  }

  await addTimelineEvent(id, userId, 'project_created', { projectName: name });

  const project = await fetchFullProject(id);
  res.status(201).json(project);
});

// GET /api/projects/:id
projectsRouter.get('/:id', requireProjectRole('viewer', 'member', 'admin', 'owner'), async (req, res) => {
  const project = await fetchFullProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  res.json(project);
});

// PATCH /api/projects/:id
projectsRouter.patch('/:id', requireProjectRole('admin', 'owner'), async (req, res) => {
  const { name, description, color, startDate, endDate } = req.body;
  const fields: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;
  if (name        !== undefined) { fields.push(`name=$${idx++}`);        vals.push(name); }
  if (description !== undefined) { fields.push(`description=$${idx++}`); vals.push(description); }
  if (color       !== undefined) { fields.push(`color=$${idx++}`);       vals.push(color); }
  if (startDate   !== undefined) { fields.push(`start_date=$${idx++}`);  vals.push(startDate || null); }
  if (endDate     !== undefined) { fields.push(`end_date=$${idx++}`);    vals.push(endDate || null); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
  fields.push(`updated_at=$${idx++}`);
  vals.push(new Date().toISOString());
  vals.push(req.params.id);

  await db.query(`UPDATE projects SET ${fields.join(',')} WHERE id=$${idx}`, vals);
  res.json(await fetchFullProject(req.params.id));
});

// DELETE /api/projects/:id
projectsRouter.delete('/:id', requireProjectRole('owner'), async (req, res) => {
  await db.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// POST /api/projects/:id/members
projectsRouter.post('/:id/members', requireProjectRole('admin', 'owner'), async (req, res) => {
  const { userId, role } = req.body;
  await db.query(
    `INSERT INTO project_members (project_id,user_id,role) VALUES ($1,$2,$3)
     ON CONFLICT (project_id,user_id) DO UPDATE SET role=$3`,
    [req.params.id, userId, role],
  );
  res.json({ ok: true });
});

// DELETE /api/projects/:id/members/:userId
projectsRouter.delete('/:id/members/:userId', requireProjectRole('admin', 'owner'), async (req, res) => {
  await db.query(
    'DELETE FROM project_members WHERE project_id=$1 AND user_id=$2',
    [req.params.id, req.params.userId],
  );
  res.json({ ok: true });
});

// PUT /api/projects/:id/workflow
projectsRouter.put('/:id/workflow', requireProjectRole('admin', 'owner'), async (req, res) => {
  const { workflow } = req.body as { workflow: { id: string; label: string; color: string; order: number }[] };
  if (!Array.isArray(workflow)) return res.status(400).json({ error: 'workflow array required' });

  await db.query('DELETE FROM workflow_statuses WHERE project_id=$1', [req.params.id]);
  for (const w of workflow) {
    await db.query(
      `INSERT INTO workflow_statuses (id,project_id,label,color,"order") VALUES ($1,$2,$3,$4,$5)`,
      [w.id, req.params.id, w.label, w.color, w.order],
    );
  }
  await db.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

// POST /api/projects/:id/tags
projectsRouter.post('/:id/tags', requireProjectRole('admin', 'owner'), async (req, res) => {
  const { name, color } = req.body;
  const id = uuidv4();
  await db.query(
    'INSERT INTO tags (id,project_id,name,color) VALUES ($1,$2,$3,$4)',
    [id, req.params.id, name, color],
  );
  res.status(201).json({ id, name, color });
});

// PATCH /api/projects/:id/tags/:tagId
projectsRouter.patch('/:id/tags/:tagId', requireProjectRole('admin', 'owner'), async (req, res) => {
  const { name, color } = req.body;
  await db.query(
    'UPDATE tags SET name=COALESCE($1,name), color=COALESCE($2,color) WHERE id=$3 AND project_id=$4',
    [name, color, req.params.tagId, req.params.id],
  );
  res.json({ ok: true });
});

// DELETE /api/projects/:id/tags/:tagId
projectsRouter.delete('/:id/tags/:tagId', requireProjectRole('admin', 'owner'), async (req, res) => {
  await db.query('DELETE FROM tags WHERE id=$1 AND project_id=$2', [req.params.tagId, req.params.id]);
  res.json({ ok: true });
});
