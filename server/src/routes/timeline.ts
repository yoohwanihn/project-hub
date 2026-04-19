import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

export const timelineRouter = Router();
timelineRouter.use(authMiddleware);

// Helper used by other route files
export async function addTimelineEvent(
  projectId: string,
  actorId: string,
  type: string,
  payload: Record<string, unknown>,
) {
  try {
    await db.query(
      `INSERT INTO timeline_events (id,type,actor_id,project_id,payload,created_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,NOW())`,
      [uuidv4(), type, actorId || null, projectId, JSON.stringify(payload)],
    );
  } catch (err) {
    console.error('[timeline] addTimelineEvent error:', err);
  }
}

// GET /api/projects/:projectId/timeline
timelineRouter.get('/:projectId/timeline', async (req, res) => {
  const { rows } = await db.query(
    `SELECT te.id, te.type, te.actor_id AS "actorId",
            te.project_id AS "projectId", te.payload,
            te.created_at AS "createdAt"
     FROM timeline_events te
     WHERE te.project_id=$1
     ORDER BY te.created_at DESC
     LIMIT 100`,
    [req.params.projectId],
  );
  res.json(rows);
});
