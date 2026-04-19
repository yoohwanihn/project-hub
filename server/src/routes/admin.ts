import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';
import logger from '../logger';

const log = logger.child({ module: 'admin' });

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole('owner', 'admin'));

// GET /api/admin/users
adminRouter.get('/users', async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, email, role, status FROM users ORDER BY
     CASE status WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END, name`
  );
  res.json(rows);
});

// PATCH /api/admin/users/:id/approve
adminRouter.patch('/users/:id/approve', async (req, res) => {
  const actorId = (req as any).user?.sub;
  const { rows } = await db.query(
    `UPDATE users SET status='active' WHERE id=$1
     RETURNING id, name, email, role, status`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  log.info({ actorId, targetUserId: rows[0].id, email: rows[0].email }, 'user approved');
  res.json(rows[0]);
});

// PATCH /api/admin/users/:id/reject
adminRouter.patch('/users/:id/reject', async (req, res) => {
  const actorId = (req as any).user?.sub;
  const { rows } = await db.query(
    `UPDATE users SET status='rejected' WHERE id=$1
     RETURNING id, name, email, role, status`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  log.warn({ actorId, targetUserId: rows[0].id, email: rows[0].email }, 'user rejected');
  res.json(rows[0]);
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', async (req, res) => {
  const actorId = (req as any).user?.sub;
  const { role } = req.body;
  const validRoles = ['owner', 'admin', 'member', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
  }
  const { rows } = await db.query(
    `UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role, status`,
    [role, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  log.info({ actorId, targetUserId: rows[0].id, newRole: role }, 'user role changed');
  res.json(rows[0]);
});
