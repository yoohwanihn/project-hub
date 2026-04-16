import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware, requireProjectMember } from '../middleware/auth';

export const pollsRouter = Router({ mergeParams: true });
pollsRouter.use(authMiddleware);

async function fetchPoll(pollId: string) {
  const { rows: [poll] } = await db.query(
    `SELECT id, project_id AS "projectId", title, description,
            is_multiple AS "isMultiple",
            show_results_before_close AS "showResultsBeforeClose",
            status, to_char(due_date,'YYYY-MM-DD') AS "dueDate",
            author_id AS "authorId", created_at AS "createdAt"
     FROM polls WHERE id=$1`,
    [pollId],
  );
  if (!poll) return null;

  const { rows: options } = await db.query(
    `SELECT po.id, po.label, po."order",
            COALESCE(array_agg(pv.user_id) FILTER (WHERE pv.user_id IS NOT NULL), '{}') AS "voterIds"
     FROM poll_options po
     LEFT JOIN poll_votes pv ON pv.option_id=po.id
     WHERE po.poll_id=$1
     GROUP BY po.id, po.label, po."order"
     ORDER BY po."order"`,
    [pollId],
  );

  return { ...poll, options };
}

// GET /api/projects/:projectId/polls
pollsRouter.get('/', requireProjectMember, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id FROM polls WHERE project_id=$1 ORDER BY created_at DESC',
    [req.params.projectId],
  );
  const polls = await Promise.all(rows.map((r) => fetchPoll(r.id)));
  res.json(polls.filter(Boolean));
});

// POST /api/projects/:projectId/polls
pollsRouter.post('/', requireProjectMember, async (req, res) => {
  const userId = req.user!.sub;
  const { title, description, options, isMultiple, showResultsBeforeClose, dueDate } = req.body;
  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'title and at least 2 options required' });
  }
  const id = uuidv4();
  await db.query(
    `INSERT INTO polls (id,project_id,title,description,is_multiple,show_results_before_close,status,due_date,author_id,created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'active',$7,$8,NOW())`,
    [id, req.params.projectId, title, description || '', isMultiple ?? false,
     showResultsBeforeClose ?? true, dueDate || null, userId],
  );
  for (let i = 0; i < options.length; i++) {
    await db.query(
      'INSERT INTO poll_options (id,poll_id,label,"order") VALUES ($1,$2,$3,$4)',
      [uuidv4(), id, options[i], i],
    );
  }
  res.status(201).json(await fetchPoll(id));
});

// PATCH /api/polls/:id  (edit title/desc OR close)
pollsRouter.patch('/:id', async (req, res) => {
  const { title, description, status } = req.body;
  await db.query(
    `UPDATE polls SET
       title=COALESCE($1,title),
       description=COALESCE($2,description),
       status=COALESCE($3,status)
     WHERE id=$4`,
    [title, description, status, req.params.id],
  );
  res.json(await fetchPoll(req.params.id));
});

// DELETE /api/polls/:id
pollsRouter.delete('/:id', async (req, res) => {
  await db.query('DELETE FROM polls WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// POST /api/polls/:id/vote
pollsRouter.post('/:id/vote', async (req, res) => {
  const userId = req.user!.sub;
  const { optionId } = req.body;
  const { rows: [poll] } = await db.query('SELECT * FROM polls WHERE id=$1', [req.params.id]);
  if (!poll || poll.status === 'closed') return res.status(400).json({ error: 'Poll not available' });

  if (!poll.is_multiple) {
    // remove existing votes in this poll
    await db.query(
      `DELETE FROM poll_votes WHERE poll_id=$1 AND user_id=$2`,
      [req.params.id, userId],
    );
  }
  await db.query(
    `INSERT INTO poll_votes (poll_id,option_id,user_id) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [req.params.id, optionId, userId],
  );
  res.json(await fetchPoll(req.params.id));
});

// DELETE /api/polls/:id/vote
pollsRouter.delete('/:id/vote', async (req, res) => {
  const userId = req.user!.sub;
  const { optionId } = req.body;
  await db.query(
    'DELETE FROM poll_votes WHERE poll_id=$1 AND option_id=$2 AND user_id=$3',
    [req.params.id, optionId, userId],
  );
  res.json(await fetchPoll(req.params.id));
});
