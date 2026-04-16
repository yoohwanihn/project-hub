import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

export interface JwtPayload {
  sub: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: 'Insufficient global role' }); return; }
    next();
  };
}

export function requireProjectRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    if (['owner', 'admin'].includes(req.user.role)) { next(); return; }

    const projectId =
      (req.params.projectId as string) ||
      (req.params.id as string) ||
      (req.body.projectId as string) ||
      (req.query.projectId as string);

    if (!projectId) { res.status(400).json({ error: 'projectId required' }); return; }

    try {
      const { rows } = await db.query(
        'SELECT role FROM project_members WHERE project_id=$1 AND user_id=$2',
        [projectId, req.user.sub]
      );
      if (rows.length === 0) { res.status(403).json({ error: 'Not a project member' }); return; }
      if (!roles.includes(rows[0].role)) { res.status(403).json({ error: 'Insufficient project role' }); return; }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function requireProjectMember() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    if (['owner', 'admin'].includes(req.user.role)) { next(); return; }

    const projectId =
      (req.params.projectId as string) ||
      (req.params.id as string) ||
      (req.body.projectId as string) ||
      (req.query.projectId as string);

    if (!projectId) { res.status(400).json({ error: 'projectId required' }); return; }

    try {
      const { rows } = await db.query(
        'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
        [projectId, req.user.sub]
      );
      if (rows.length === 0) { res.status(403).json({ error: 'Not a project member' }); return; }
      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
