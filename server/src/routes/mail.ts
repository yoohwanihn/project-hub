import { Router } from 'express';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import multer from 'multer';
import { simpleParser } from 'mailparser';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import logger from '../logger';

const log = logger.child({ module: 'mail' });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

export const mailRouter = Router();
mailRouter.use(authMiddleware);

// ── AES-256 암호화 (DB 저장용) ─────────────────────────────────────
const ALGO = 'aes-256-cbc';

function getKey(): Buffer {
  const secret = process.env.JWT_ACCESS_SECRET ?? 'fallback_secret';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptPassword(text: string): string {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

function decryptPassword(data: string): string {
  const [ivHex, encHex] = data.split(':');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
}

function checkHasAttachments(struct: any): boolean {
  if (!struct) return false;
  if (struct.disposition?.value?.toLowerCase() === 'attachment') return true;
  if (Array.isArray(struct.childNodes)) {
    return struct.childNodes.some((child: any) => checkHasAttachments(child));
  }
  return false;
}

// ── In-memory IMAP 세션 (활성 연결만 보관) ────────────────────────
const sessions = new Map<string, ImapFlow>();

async function createImapClient(email: string, password: string): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: 'imap.daum.net', port: 993, secure: true,
    auth: { user: email, pass: password },
    logger: false,
  });
  await client.connect();
  return client;
}

async function getOrReconnect(userId: string): Promise<ImapFlow | null> {
  const existing = sessions.get(userId);
  if (existing) return existing;

  const row = await db.query<{ mail_app_password: string | null; mail_daum_email: string | null }>(
    'SELECT mail_app_password, mail_daum_email FROM users WHERE id = $1', [userId]
  );
  const enc       = row.rows[0]?.mail_app_password;
  const daumEmail = row.rows[0]?.mail_daum_email;
  if (!enc || !daumEmail) return null;

  try {
    const password = decryptPassword(enc);
    const client   = await createImapClient(daumEmail, password);
    sessions.set(userId, client);
    return client;
  } catch {
    return null;
  }
}

// ── POST /api/mail/connect ─────────────────────────────────────────
mailRouter.post('/connect', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const { daumEmail, password } = req.body as { daumEmail: string; password: string };

  if (!daumEmail || !password) return res.status(400).json({ error: 'Daum 메일 주소와 비밀번호를 입력해주세요.' });

  const normalizedEmail = daumEmail.trim().toLowerCase();

  // 기존 연결 해제
  const existing = sessions.get(userId);
  if (existing) { await existing.logout().catch(() => {}); sessions.delete(userId); }

  try {
    const client = await createImapClient(normalizedEmail, password);
    sessions.set(userId, client);

    // 암호화 후 DB 저장
    await db.query(
      'UPDATE users SET mail_app_password = $1, mail_daum_email = $2 WHERE id = $3',
      [encryptPassword(password), normalizedEmail, userId]
    );

    log.info({ userId, email: normalizedEmail }, 'mail account connected');
    res.json({ ok: true, email: normalizedEmail });
  } catch (e: any) {
    log.warn({ userId, email: normalizedEmail, err: e.message }, 'mail connect failed');
    res.status(401).json({ error: '연결 실패. Daum 메일 주소와 앱 비밀번호를 확인하고, IMAP이 허용되어 있는지 확인해주세요.' });
  }
});

// ── POST /api/mail/disconnect ─────────────────────────────────────
mailRouter.post('/disconnect', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = sessions.get(userId);
  if (sess) { await sess.logout().catch(() => {}); sessions.delete(userId); }
  await db.query('UPDATE users SET mail_app_password = NULL WHERE id = $1', [userId]);
  log.info({ userId }, 'mail account disconnected');
  res.json({ ok: true });
});

// ── GET /api/mail/status ──────────────────────────────────────────
mailRouter.get('/status', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const row    = await db.query<{ mail_daum_email: string | null }>(
    'SELECT mail_daum_email FROM users WHERE id = $1', [userId]
  );
  const daumEmail = row.rows[0]?.mail_daum_email ?? null;
  const client    = await getOrReconnect(userId);
  res.json({ connected: !!client, email: daumEmail });
});

// ── GET /api/mail/folders ─────────────────────────────────────────
mailRouter.get('/folders', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const client = await getOrReconnect(userId);
  if (!client) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  try {
    const list = await client.list();
    res.json(list.map((f) => ({ path: f.path, name: f.name })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/mail/messages ────────────────────────────────────────
mailRouter.get('/messages', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const client = await getOrReconnect(userId);
  if (!client) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const status = await client.status(folder, { messages: true, unseen: true });
      const total  = status.messages ?? 0;
      const unseen = status.unseen   ?? 0;
      if (total === 0) return res.json({ messages: [], total: 0, unseen: 0, page, limit });

      const lastSeq  = total;
      const firstSeq = Math.max(1, lastSeq - (page - 1) * limit - limit + 1);
      const endSeq   = Math.max(1, lastSeq - (page - 1) * limit);

      const messages: any[] = [];
      for await (const msg of client.fetch(`${firstSeq}:${endSeq}`, {
        uid: true, flags: true, envelope: true, bodyStructure: true,
      })) {
        const hasAttachments = checkHasAttachments(msg.bodyStructure);
        messages.push({
          seq:            msg.seq,
          uid:            msg.uid,
          seen:           (msg.flags ?? new Set()).has('\\Seen'),
          from:           msg.envelope?.from?.[0]  ?? null,
          to:             msg.envelope?.to          ?? [],
          subject:        msg.envelope?.subject     ?? '(제목 없음)',
          date:           msg.envelope?.date        ?? null,
          hasAttachments,
        });
      }
      res.json({ messages: messages.reverse(), total, unseen, page, limit });
    } finally {
      lock.release();
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/mail/messages/:uid ───────────────────────────────────
mailRouter.get('/messages/:uid', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const client = await getOrReconnect(userId);
  if (!client) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const uid    = parseInt(req.params.uid);

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const msg = await client.fetchOne(`${uid}`, {
        uid: true, flags: true, envelope: true, source: true,
      }, { uid: true });
      if (!msg) return res.status(404).json({ error: '메일을 찾을 수 없습니다.' });

      await client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true });

      let body = '';
      let attachments: { filename: string; contentType: string; size: number; data: string }[] = [];
      if (msg.source) {
        const parsed = await simpleParser(msg.source);
        body = parsed.html || parsed.text || '';
        attachments = (parsed.attachments ?? [])
          .filter((a) => a.contentDisposition === 'attachment' || (!a.contentId && !a.contentDisposition))
          .map((a) => ({
            filename:    a.filename ?? 'attachment',
            contentType: a.contentType ?? 'application/octet-stream',
            size:        a.size ?? a.content.length,
            data:        a.content.toString('base64'),
          }));
      }

      res.json({
        uid:         msg.uid,
        flags:       [...(msg.flags ?? [])],
        from:        msg.envelope?.from ?? [],
        to:          msg.envelope?.to   ?? [],
        cc:          msg.envelope?.cc   ?? [],
        subject:     msg.envelope?.subject ?? '(제목 없음)',
        date:        msg.envelope?.date    ?? null,
        body,
        attachments,
      });
    } finally {
      lock.release();
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/mail/send ───────────────────────────────────────────
mailRouter.post('/send', upload.array('attachments'), async (req, res) => {
  const userId = (req as any).user.sub as string;
  const row    = await db.query<{ mail_app_password: string | null; mail_daum_email: string | null }>(
    'SELECT mail_app_password, mail_daum_email FROM users WHERE id = $1', [userId]
  );
  const enc   = row.rows[0]?.mail_app_password;
  const email = row.rows[0]?.mail_daum_email;
  if (!enc || !email) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const password = decryptPassword(enc);
  const { to, cc, subject, body } = req.body as { to: string; cc?: string; subject: string; body: string };
  if (!to || !subject) return res.status(400).json({ error: '받는 사람과 제목을 입력해주세요.' });

  const files = (req.files as Express.Multer.File[]) ?? [];

  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.daum.net', port: 465, secure: true,
      auth: { user: email, pass: password },
    });
    await transport.sendMail({
      from: email, to, cc: cc || undefined, subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      attachments: files.map((f) => ({
        filename: f.originalname,
        content:  f.buffer,
        contentType: f.mimetype,
      })),
    });
    log.info({ userId, to, subject, attachments: files.length }, 'mail sent');
    res.json({ ok: true });
  } catch (e: any) {
    log.error({ userId, to, err: e.message }, 'mail send failed');
    res.status(500).json({ error: `발송 실패: ${e.message}` });
  }
});

// ── DELETE /api/mail/messages/:uid ───────────────────────────────
mailRouter.delete('/messages/:uid', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const client = await getOrReconnect(userId);
  if (!client) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const uid    = parseInt(req.params.uid);

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageDelete(`${uid}`, { uid: true });
    } finally {
      lock.release();
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/mail/messages (bulk) ─────────────────────────────
mailRouter.delete('/messages', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const client = await getOrReconnect(userId);
  if (!client) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const uids   = (req.body.uids as number[]) ?? [];
  if (!uids.length) return res.status(400).json({ error: 'uid 목록이 필요합니다.' });

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      await client.messageDelete(uids.join(','), { uid: true });
    } finally {
      lock.release();
    }
    log.info({ userId, folder, uids, count: uids.length }, 'mail messages deleted');
    res.json({ ok: true, deleted: uids.length });
  } catch (e: any) {
    log.error({ userId, err: e.message }, 'mail bulk delete failed');
    res.status(500).json({ error: e.message });
  }
});
