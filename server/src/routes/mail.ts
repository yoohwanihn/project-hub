import { Router } from 'express';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { authMiddleware } from '../middleware/auth';

export const mailRouter = Router();
mailRouter.use(authMiddleware);

// ── In-memory session store: userId → { imap, password, email } ──
interface MailSession {
  client:   ImapFlow;
  password: string;
  email:    string;
}
const sessions = new Map<string, MailSession>();

function getSession(userId: string): MailSession | undefined {
  return sessions.get(userId);
}

// ── POST /api/mail/connect ─────────────────────────────────────────
mailRouter.post('/connect', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const email  = (req as any).user.email as string;
  const { password } = req.body as { password: string };

  if (!password) return res.status(400).json({ error: '비밀번호를 입력해주세요.' });

  // 기존 연결 해제
  const existing = sessions.get(userId);
  if (existing) {
    await existing.client.logout().catch(() => {});
    sessions.delete(userId);
  }

  const client = new ImapFlow({
    host:   'imap.daum.net',
    port:   993,
    secure: true,
    auth:   { user: email, pass: password },
    logger: false,
  });

  try {
    await client.connect();
    sessions.set(userId, { client, password, email });
    res.json({ ok: true, email });
  } catch (e: any) {
    res.status(401).json({ error: '연결 실패. 이메일/비밀번호를 확인하거나 Daum 메일 보안설정에서 IMAP을 허용해주세요.' });
  }
});

// ── POST /api/mail/disconnect ─────────────────────────────────────
mailRouter.post('/disconnect', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess = sessions.get(userId);
  if (sess) {
    await sess.client.logout().catch(() => {});
    sessions.delete(userId);
  }
  res.json({ ok: true });
});

// ── GET /api/mail/status ─────────────────────────────────────────
mailRouter.get('/status', (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = sessions.get(userId);
  res.json({ connected: !!sess, email: sess?.email ?? null });
});

// ── GET /api/mail/folders ─────────────────────────────────────────
mailRouter.get('/folders', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = getSession(userId);
  if (!sess) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  try {
    const list = await sess.client.list();
    const folders = list.map((f) => ({
      path:      f.path,
      name:      f.name,
      delimiter: f.delimiter,
      flags:     [...(f.flags ?? [])],
    }));
    res.json(folders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/mail/messages ────────────────────────────────────────
// query: folder, page (1-based), limit
mailRouter.get('/messages', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = getSession(userId);
  if (!sess) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);

  try {
    const lock = await sess.client.getMailboxLock(folder);
    try {
      const status = await sess.client.status(folder, { messages: true, unseen: true });
      const total  = status.messages ?? 0;
      const unseen = status.unseen   ?? 0;

      if (total === 0) {
        return res.json({ messages: [], total: 0, unseen: 0, page, limit });
      }

      // 최신순 페이징: 마지막 메시지부터 역순
      const lastSeq  = total;
      const firstSeq = Math.max(1, lastSeq - (page - 1) * limit - limit + 1);
      const endSeq   = Math.max(1, lastSeq - (page - 1) * limit);

      const messages: any[] = [];
      for await (const msg of sess.client.fetch(`${firstSeq}:${endSeq}`, {
        uid: true, flags: true, envelope: true, bodyStructure: true,
      })) {
        messages.push({
          seq:     msg.seq,
          uid:     msg.uid,
          flags:   [...(msg.flags ?? [])],
          seen:    (msg.flags ?? new Set()).has('\\Seen'),
          from:    msg.envelope?.from?.[0]  ?? null,
          to:      msg.envelope?.to         ?? [],
          subject: msg.envelope?.subject    ?? '(제목 없음)',
          date:    msg.envelope?.date       ?? null,
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
  const sess   = getSession(userId);
  if (!sess) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const uid    = parseInt(req.params.uid);

  try {
    const lock = await sess.client.getMailboxLock(folder);
    try {
      const msg = await sess.client.fetchOne(`${uid}`, {
        uid: true, flags: true, envelope: true,
        bodyParts: ['TEXT', '1', '2'],
        source: true,
      }, { uid: true });

      if (!msg) return res.status(404).json({ error: '메일을 찾을 수 없습니다.' });

      // 읽음 처리
      await sess.client.messageFlagsAdd(`${uid}`, ['\\Seen'], { uid: true });

      // source에서 텍스트/HTML 파트 추출
      let body = '';
      if (msg.source) {
        const raw = msg.source.toString();
        // HTML 파트 찾기
        const htmlMatch = raw.match(/Content-Type:\s*text\/html[^]*?\r?\n\r?\n([\s\S]*?)(?=--|\z)/i);
        const textMatch = raw.match(/Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([\s\S]*?)(?=--|\z)/i);
        body = htmlMatch?.[1] ?? textMatch?.[1] ?? raw;
      }

      res.json({
        uid:     msg.uid,
        flags:   [...(msg.flags ?? [])],
        from:    msg.envelope?.from    ?? [],
        to:      msg.envelope?.to      ?? [],
        cc:      msg.envelope?.cc      ?? [],
        subject: msg.envelope?.subject ?? '(제목 없음)',
        date:    msg.envelope?.date    ?? null,
        body,
      });
    } finally {
      lock.release();
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/mail/send ───────────────────────────────────────────
mailRouter.post('/send', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = getSession(userId);
  if (!sess) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const { to, cc, subject, body, html } = req.body as {
    to: string; cc?: string; subject: string; body: string; html?: string;
  };
  if (!to || !subject) return res.status(400).json({ error: '받는 사람과 제목을 입력해주세요.' });

  try {
    const transport = nodemailer.createTransport({
      host:   'smtp.daum.net',
      port:   465,
      secure: true,
      auth:   { user: sess.email, pass: sess.password },
    });

    await transport.sendMail({
      from:    sess.email,
      to,
      cc:      cc || undefined,
      subject,
      text:    body,
      html:    html || `<p>${body.replace(/\n/g, '<br>')}</p>`,
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: `발송 실패: ${e.message}` });
  }
});

// ── DELETE /api/mail/messages/:uid ───────────────────────────────
mailRouter.delete('/messages/:uid', async (req, res) => {
  const userId = (req as any).user.sub as string;
  const sess   = getSession(userId);
  if (!sess) return res.status(401).json({ error: '메일 연결이 필요합니다.' });

  const folder = (req.query.folder as string) || 'INBOX';
  const uid    = parseInt(req.params.uid);

  try {
    const lock = await sess.client.getMailboxLock(folder);
    try {
      await sess.client.messageDelete(`${uid}`, { uid: true });
    } finally {
      lock.release();
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
