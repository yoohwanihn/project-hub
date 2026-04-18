import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { authRouter }          from './routes/auth';
import { adminRouter }         from './routes/admin';
import { projectsRouter }      from './routes/projects';
import { tasksRouter }         from './routes/tasks';
import { wikiRouter }          from './routes/wiki';
import { announcementsRouter } from './routes/announcements';
import { filesRouter }         from './routes/files';
import { pollsRouter }         from './routes/polls';
import { timelineRouter }      from './routes/timeline';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',   authRouter);
app.use('/api/admin',  adminRouter);
app.use('/api/users',  authRouter);   // /api/users → authRouter handles GET /users

// projects + nested resources
app.use('/api/projects',                        projectsRouter);
app.use('/api/projects/:projectId/tasks',       tasksRouter);
app.use('/api/projects/:projectId/tasks',       tasksRouter);  // also handles /move
app.use('/api/tasks',                           tasksRouter);   // PATCH/DELETE /api/tasks/:id
app.use('/api/projects/:projectId/wiki',        wikiRouter);
app.use('/api/wiki',                            wikiRouter);
app.use('/api/projects/:projectId/announcements', announcementsRouter);
app.use('/api/announcements',                   announcementsRouter);
app.use('/api/projects/:projectId/files',       filesRouter);
app.use('/api/files',                           filesRouter);
app.use('/api/projects/:projectId/polls',       pollsRouter);
app.use('/api/polls',                           pollsRouter);
app.use('/api/projects',                        timelineRouter);

// 전역 에러 핸들러 (async 핸들러 미처리 예외 포함)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
