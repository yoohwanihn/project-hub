import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware, requireProjectMember } from '../middleware/auth';
import { addTimelineEvent } from './timeline';
import logger from '../logger';

const log = logger.child({ module: 'tasks' });

export const tasksRouter = Router({ mergeParams: true });
tasksRouter.use(authMiddleware);

function mapTask(row: Record<string, unknown>) {
  return {
    id:             row.id,
    projectId:      row.project_id,
    title:          row.title,
    description:    row.description ?? '',
    statusId:       row.status_id,
    priority:       row.priority,
    assigneeIds:    row.assignee_ids ?? [],
    tagIds:         row.tag_ids ?? [],
    blockedBy:      row.blocked_by ?? [],
    startDate:      row.start_date ?? undefined,
    dueDate:        row.due_date ?? undefined,
    estimatedHours: row.estimated_hours ? Number(row.estimated_hours) : undefined,
    loggedHours:    Number(row.logged_hours ?? 0),
    order:          Number(row.order ?? 0),
    parentId:       row.parent_id ?? undefined,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

// GET /api/projects/:projectId/tasks
tasksRouter.get('/', requireProjectMember, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM tasks WHERE project_id=$1 ORDER BY "order"`,
    [req.params.projectId],
  );
  res.json(rows.map(mapTask));
});

// POST /api/projects/:projectId/tasks
tasksRouter.post('/', requireProjectMember, async (req, res) => {
  const userId = req.user!.sub;
  const { title, description, statusId, priority, assigneeIds, tagIds, blockedBy,
          startDate, dueDate, estimatedHours, parentId } = req.body;

  if (!title || !statusId || !priority) {
    return res.status(400).json({ error: 'title, statusId, priority required' });
  }

  // compute max order in column
  const { rows: [{ max }] } = await db.query(
    `SELECT COALESCE(MAX("order"), -1) AS max FROM tasks
     WHERE project_id=$1 AND status_id=$2`,
    [req.params.projectId, statusId],
  );
  const order = Number(max) + 1;
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO tasks
       (id,project_id,title,description,status_id,priority,assignee_ids,tag_ids,
        blocked_by,start_date,due_date,estimated_hours,"order",parent_id,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)`,
    [
      id, req.params.projectId, title, description || '', statusId, priority,
      assigneeIds || [], tagIds || [], blockedBy || [],
      startDate || null, dueDate || null, estimatedHours || null,
      order, parentId || null, now,
    ],
  );
  await db.query(`UPDATE projects SET updated_at=$1 WHERE id=$2`, [now, req.params.projectId]);
  await addTimelineEvent(req.params.projectId, userId, 'task_created', { taskId: id, taskTitle: title });

  const { rows: [row] } = await db.query('SELECT * FROM tasks WHERE id=$1', [id]);
  log.info({ userId, projectId: req.params.projectId, taskId: id, title }, 'task created');
  res.status(201).json(mapTask(row));
});

// PATCH /api/tasks/:taskId
tasksRouter.patch('/:taskId', async (req, res) => {
  const userId = req.user!.sub;
  const { rows: [prev] } = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.taskId]);
  if (!prev) return res.status(404).json({ error: 'Task not found' });

  const allowed = ['title','description','status_id','priority','assignee_ids','tag_ids',
                   'blocked_by','start_date','due_date','estimated_hours','order','parent_id'];
  const fields: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  const fieldMap: Record<string, string> = {
    statusId: 'status_id', assigneeIds: 'assignee_ids', tagIds: 'tag_ids',
    blockedBy: 'blocked_by', startDate: 'start_date', dueDate: 'due_date',
    estimatedHours: 'estimated_hours', parentId: 'parent_id',
  };

  for (const [key, val] of Object.entries(req.body)) {
    const col = fieldMap[key] ?? key;
    if (!allowed.includes(col)) continue;
    fields.push(`${col}=$${idx++}`);
    vals.push(val ?? null);
  }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  fields.push(`updated_at=$${idx++}`);
  vals.push(new Date().toISOString());
  vals.push(req.params.taskId);

  await db.query(`UPDATE tasks SET ${fields.join(',')} WHERE id=$${idx}`, vals);
  await db.query(`UPDATE projects SET updated_at=NOW() WHERE id=$1`, [prev.project_id]);

  // timeline: status change
  if (req.body.statusId && req.body.statusId !== prev.status_id) {
    const type = req.body.statusId.endsWith('-done') || req.body.statusId === 'done'
      ? 'task_completed' : 'task_updated';
    await addTimelineEvent(prev.project_id, userId, type, {
      taskId: prev.id, taskTitle: prev.title,
      field: 'status', from: prev.status_id, to: req.body.statusId,
    });
    log.info({ userId, taskId: prev.id, from: prev.status_id, to: req.body.statusId }, 'task status changed');
  } else {
    log.info({ userId, taskId: prev.id, fields: Object.keys(req.body) }, 'task updated');
  }

  const { rows: [row] } = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.taskId]);
  res.json(mapTask(row));
});

// DELETE /api/tasks/:taskId
tasksRouter.delete('/:taskId', async (req, res) => {
  const userId = req.user!.sub;
  const { rows: [task] } = await db.query('SELECT * FROM tasks WHERE id=$1', [req.params.taskId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  await db.query('DELETE FROM tasks WHERE id=$1', [req.params.taskId]);
  await addTimelineEvent(task.project_id, userId, 'task_deleted', { taskId: task.id, taskTitle: task.title });
  log.info({ userId, taskId: task.id, title: task.title, projectId: task.project_id }, 'task deleted');
  res.json({ ok: true });
});

// POST /api/projects/:projectId/tasks/move  (drag-and-drop reorder)
tasksRouter.post('/move', requireProjectMember, async (req, res) => {
  const { taskId, toStatusId, toIndex } = req.body;
  const { rows: [task] } = await db.query('SELECT * FROM tasks WHERE id=$1', [taskId]);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Re-order destination column
  const { rows: colTasks } = await db.query(
    `SELECT id FROM tasks
     WHERE project_id=$1 AND status_id=$2 AND id<>$3
     ORDER BY "order"`,
    [req.params.projectId, toStatusId, taskId],
  );
  colTasks.splice(toIndex, 0, { id: taskId });

  await db.query(`UPDATE tasks SET status_id=$1, updated_at=NOW() WHERE id=$2`, [toStatusId, taskId]);
  for (let i = 0; i < colTasks.length; i++) {
    await db.query(`UPDATE tasks SET "order"=$1 WHERE id=$2`, [i, colTasks[i].id]);
  }
  res.json({ ok: true });
});
