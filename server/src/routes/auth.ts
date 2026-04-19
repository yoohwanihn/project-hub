import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { db } from '../db';
import { authMiddleware, JwtPayload } from '../middleware/auth';
import logger from '../logger';

const log = logger.child({ module: 'auth' });

const AVATAR_DIR = path.resolve(__dirname, '../../../uploads/avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename:    (_req, _file, cb) => cb(null, `${randomUUID()}.jpg`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드 가능합니다.'));
  },
});

export const authRouter = Router();

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  );
  const refreshToken = randomUUID() + '-' + randomUUID();
  return { accessToken, refreshToken };
}

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: '이름, 이메일, 비밀번호를 모두 입력해 주세요.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
  }

  const { rows: existing } = await db.query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.length > 0) {
    log.warn({ email }, 'register failed: email already exists');
    return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await db.query(
    `INSERT INTO users (id, name, email, role, password_hash, status)
     VALUES ($1, $2, $3, 'member', $4, 'pending')`,
    [id, name, email, password_hash]
  );

  log.info({ userId: id, email }, 'user registered (pending approval)');
  res.status(201).json({ message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인하실 수 있습니다.' });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' });
  }

  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  if (rows.length === 0) {
    log.warn({ email }, 'login failed: user not found');
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const user = rows[0];

  if (user.status === 'pending') {
    log.warn({ userId: user.id, email }, 'login blocked: account pending');
    return res.status(403).json({ error: 'pending', message: '관리자 승인 대기 중입니다.' });
  }
  if (user.status === 'rejected') {
    log.warn({ userId: user.id, email }, 'login blocked: account rejected');
    return res.status(403).json({ error: 'rejected', message: '계정이 거절되었습니다. 관리자에게 문의해 주세요.' });
  }

  if (!user.password_hash) {
    log.warn({ userId: user.id, email }, 'login failed: no password hash');
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    log.warn({ userId: user.id, email }, 'login failed: wrong password');
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), user.id, hashRefreshToken(refreshToken), expiresAt]
  );

  log.info({ userId: user.id, email, role: user.role }, 'user logged in');
  res.json({
    accessToken,
    refreshToken,
    user: {
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      status: user.status,
      avatar: user.avatar ?? null,
    },
  });
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken required' });
  }

  const hash = hashRefreshToken(refreshToken);
  const { rows } = await db.query(
    `SELECT rt.*, u.role, u.status FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash=$1 AND rt.expires_at > NOW()`,
    [hash]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  const row = rows[0];
  if (row.status !== 'active') {
    return res.status(403).json({ error: '비활성화된 계정입니다.' });
  }

  const accessToken = jwt.sign(
    { sub: row.user_id, role: row.role },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'] }
  );

  res.json({ accessToken });
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, async (req, res) => {
  const userId = (req as any).user?.sub;
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hashRefreshToken(refreshToken)]);
  }
  log.info({ userId }, 'user logged out');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, status, avatar FROM users WHERE id=$1',
    [req.user!.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// DELETE /api/auth/me  (회원 탈퇴)
authRouter.delete('/me', authMiddleware, async (req, res) => {
  const userId = req.user!.sub;
  const { refreshToken } = req.body;
  if (refreshToken) {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await db.query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hash]);
  }
  await db.query('DELETE FROM users WHERE id=$1', [userId]);
  log.info({ userId }, 'user account deleted');
  res.json({ message: '계정이 삭제되었습니다.' });
});

// GET /api/users  (프로젝트 멤버 초대 등에 사용)
authRouter.get('/users', authMiddleware, async (_req, res) => {
  const { rows } = await db.query(
    `SELECT id, name, email, role, status, avatar FROM users WHERE status='active' ORDER BY name`
  );
  res.json(rows);
});

// PATCH /api/auth/me  (프로필 수정: 이름, 이메일)
authRouter.patch('/me', authMiddleware, async (req, res) => {
  const userId = req.user!.sub;
  const { name, email } = req.body;
  if (!name && !email) return res.status(400).json({ error: '변경할 항목이 없습니다.' });

  if (email) {
    const { rows } = await db.query('SELECT id FROM users WHERE email=$1 AND id!=$2', [email, userId]);
    if (rows.length > 0) return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
  }

  await db.query(
    `UPDATE users SET
       name  = COALESCE($1, name),
       email = COALESCE($2, email)
     WHERE id = $3`,
    [name || null, email || null, userId],
  );

  const { rows: [user] } = await db.query(
    'SELECT id, name, email, role, status, avatar FROM users WHERE id=$1', [userId],
  );
  res.json(user);
});

// POST /api/auth/me/password  (비밀번호 변경)
authRouter.post('/me/password', authMiddleware, async (req, res) => {
  const userId = req.user!.sub;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 입력해 주세요.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '새 비밀번호는 8자 이상이어야 합니다.' });
  }

  const { rows: [user] } = await db.query('SELECT password_hash FROM users WHERE id=$1', [userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(400).json({ error: '현재 비밀번호가 올바르지 않습니다.' });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, userId]);
  res.json({ message: '비밀번호가 변경되었습니다.' });
});

// POST /api/auth/me/avatar  (프로필 사진 업로드)
authRouter.post(
  '/me/avatar',
  authMiddleware,
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  async (req, res) => {
    const userId = req.user!.sub;
    const file = req.file;
    if (!file) return res.status(400).json({ error: '파일이 없습니다.' });

    // 기존 아바타 파일 삭제
    const { rows: [old] } = await db.query('SELECT avatar FROM users WHERE id=$1', [userId]);
    if (old?.avatar) {
      const oldPath = path.join(AVATAR_DIR, path.basename(old.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/api/avatars/${file.filename}`;
    await db.query('UPDATE users SET avatar=$1 WHERE id=$2', [avatarUrl, userId]);

    const { rows: [user] } = await db.query(
      'SELECT id, name, email, role, status, avatar FROM users WHERE id=$1', [userId],
    );
    res.json(user);
  },
);

// GET /api/avatars/:filename  (아바타 이미지 서빙)
authRouter.get('/:filename', (req, res) => {
  const filePath = path.join(AVATAR_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});
