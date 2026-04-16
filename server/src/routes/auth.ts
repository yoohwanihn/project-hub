import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { db } from '../db';
import { authMiddleware, JwtPayload } from '../middleware/auth';

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
    return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = randomUUID();

  await db.query(
    `INSERT INTO users (id, name, email, role, password_hash, status)
     VALUES ($1, $2, $3, 'member', $4, 'pending')`,
    [id, name, email, password_hash]
  );

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
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const user = rows[0];

  if (user.status === 'pending') {
    return res.status(403).json({ error: 'pending', message: '관리자 승인 대기 중입니다.' });
  }
  if (user.status === 'rejected') {
    return res.status(403).json({ error: 'rejected', message: '계정이 거절되었습니다. 관리자에게 문의해 주세요.' });
  }

  if (!user.password_hash) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [randomUUID(), user.id, hashRefreshToken(refreshToken), expiresAt]
  );

  res.json({
    accessToken,
    refreshToken,
    user: {
      id:     user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      status: user.status,
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
  const { refreshToken } = req.body;
  if (refreshToken) {
    await db.query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hashRefreshToken(refreshToken)]);
  }
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, role, status FROM users WHERE id=$1',
    [req.user!.sub]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});
