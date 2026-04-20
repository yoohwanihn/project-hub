import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Inbox, RefreshCw, Trash2, ChevronLeft, ChevronRight,
  Pen, Eye, EyeOff, LogOut, AlertCircle, X, Reply, Loader2,
  ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Settings, Key, Shield,
  Paperclip, Download, FileText, Image, FileArchive, FileSpreadsheet,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { formatDate, cn } from '../../lib/utils';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────
interface MailAddress { name?: string; address?: string }
interface MailSummary {
  seq: number; uid: number; seen: boolean;
  from: MailAddress | null; subject: string; date: string | null;
  hasAttachments?: boolean;
}
interface MailAttachment { filename: string; contentType: string; size: number; data: string }
interface MailDetail extends MailSummary {
  to: MailAddress[]; cc: MailAddress[]; body: string; attachments: MailAttachment[];
}
interface Folder { path: string; name: string }
interface MessagesResult {
  messages: MailSummary[]; total: number; unseen: number; page: number; limit: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function attachIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image;
  if (contentType.includes('zip') || contentType.includes('compressed')) return FileArchive;
  if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv')) return FileSpreadsheet;
  return FileText;
}

function downloadAttachment(att: MailAttachment) {
  const byteChars = atob(att.data);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], { type: att.contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = att.filename; a.click();
  URL.revokeObjectURL(url);
}

function addrStr(a: MailAddress | null | undefined): string {
  if (!a) return '';
  return a.name ? `${a.name} <${a.address ?? ''}>` : (a.address ?? '');
}

// ── IMAP 설정 가이드 스텝 ─────────────────────────────────────────
const GUIDE_STEPS = [
  {
    icon: ExternalLink,
    title: 'Daum 메일 접속',
    desc: '브라우저에서 mail.daum.net에 접속 후 로그인하세요.',
  },
  {
    icon: Settings,
    title: '환경설정 열기',
    desc: '우측 상단 톱니바퀴(⚙) 아이콘 → [환경설정]을 클릭하세요.',
  },
  {
    icon: Shield,
    title: 'IMAP 허용',
    desc: '[메일 관리] → [POP3/IMAP 설정] → IMAP 사용을 "사용함"으로 변경 후 저장하세요.',
  },
  {
    icon: Key,
    title: '앱 비밀번호 생성',
    desc: '[보안] → [앱 비밀번호] → 앱 이름 입력 후 생성된 비밀번호를 아래에 입력하세요.',
  },
];

// ── ConnectScreen ─────────────────────────────────────────────────
function ConnectScreen({ onConnect }: { onConnect: () => void }) {
  const [daumEmail, setDaumEmail] = useState('');
  const [pw, setPw]               = useState('');
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  async function handleConnect() {
    if (!daumEmail || !pw) return;
    setLoading(true); setError('');
    try {
      await api.post('/mail/connect', { daumEmail, password: pw });
      toast.success('Daum 메일에 연결됐습니다.');
      onConnect();
    } catch (e: any) {
      setError(e.response?.data?.error ?? '연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start bg-zinc-50 dark:bg-zinc-950 p-6 gap-4">

      {/* 연결 카드 */}
      <div className="card p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center mx-auto mb-4">
          <Mail size={24} className="text-white dark:text-zinc-900" />
        </div>
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">Daum 메일 연결</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          Daum 메일 주소와 앱 비밀번호를 입력하세요.
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-left">
            <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2.5 mb-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Daum 메일 주소</label>
            <input
              type="email"
              className="input"
              placeholder="example@daum.net 또는 example@hanmail.net"
              value={daumEmail}
              onChange={(e) => setDaumEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">앱 비밀번호</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input pr-10"
                placeholder="앱 비밀번호 (일반 비밀번호 아님)"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                onClick={() => setShow((v) => !v)}
                type="button"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button className="btn-primary w-full justify-center" onClick={handleConnect} disabled={loading || !pw || !daumEmail}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> 연결 중...</> : '연결하기'}
        </button>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-4">
          입력한 정보는 암호화되어 안전하게 저장됩니다.
        </p>
      </div>

      {/* 가이드 아코디언 */}
      <div className="card w-full max-w-md overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          onClick={() => setGuideOpen((v) => !v)}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
              <Key size={13} className="text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">앱 비밀번호 설정 방법</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">처음 사용하신다면 여기를 확인하세요</p>
            </div>
          </div>
          {guideOpen
            ? <ChevronUp size={15} className="text-zinc-400 shrink-0" />
            : <ChevronDown size={15} className="text-zinc-400 shrink-0" />
          }
        </button>

        {guideOpen && (
          <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-700">
            <div className="space-y-4 pt-4">
              {GUIDE_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex gap-3.5">
                    {/* 스텝 번호 + 선 */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      {i < GUIDE_STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-700 min-h-[16px]" />
                      )}
                    </div>
                    {/* 내용 */}
                    <div className="pb-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon size={12} className="text-zinc-500 dark:text-zinc-400" />
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{step.title}</p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 바로가기 버튼 */}
            <a
              href="https://mail.daum.net"
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink size={12} /> Daum 메일 바로가기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ComposeModal ──────────────────────────────────────────────────
function ComposeModal({ onClose, defaultTo = '', defaultSubject = '', defaultBody = '' }: {
  onClose: () => void;
  defaultTo?: string; defaultSubject?: string; defaultBody?: string;
}) {
  const [to,      setTo]      = useState(defaultTo);
  const [cc,      setCc]      = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [body,    setBody]    = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [showCc,  setShowCc]  = useState(false);
  const [files,   setFiles]   = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = '';
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend() {
    if (!to.trim() || !subject.trim()) {
      toast.error('받는 사람과 제목을 입력해주세요.'); return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('to', to);
      if (cc) fd.append('cc', cc);
      fd.append('subject', subject);
      fd.append('body', body);
      files.forEach((f) => fd.append('attachments', f));
      await api.post('/mail/send', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('메일이 발송됐습니다.');
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? '발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-modal w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-700">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">새 메일 작성</h2>
          <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* fields */}
        <div className="px-5 pt-4 space-y-2.5">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-700 pb-2.5">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 w-10 shrink-0">받는 사람</span>
            <input className="flex-1 text-sm outline-none bg-transparent text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              placeholder="이메일 주소" value={to} onChange={(e) => setTo(e.target.value)} />
            <button className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300" onClick={() => setShowCc(v => !v)}>
              {showCc ? '숨기기' : 'CC 추가'}
            </button>
          </div>
          {showCc && (
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-700 pb-2.5">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 w-10 shrink-0">CC</span>
              <input className="flex-1 text-sm outline-none bg-transparent text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                placeholder="참조 이메일" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
          )}
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-700 pb-2.5">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 w-10 shrink-0">제목</span>
            <input className="flex-1 text-sm outline-none bg-transparent text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              placeholder="메일 제목" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </div>

        {/* body */}
        <textarea
          className="flex-1 px-5 py-4 text-sm bg-transparent text-zinc-800 dark:text-zinc-100 resize-none outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 min-h-48"
          placeholder="내용을 입력하세요..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* 첨부파일 목록 */}
        {files.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-zinc-100 dark:border-zinc-700 pt-3">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-200">
                <Paperclip size={11} className="text-zinc-400" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <span className="text-zinc-400">({formatBytes(f.size)})</span>
                <button onClick={() => removeFile(i)} className="ml-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 rounded-b-2xl">
          <div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <button className="btn-ghost text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={13} /> 파일 첨부
            </button>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>취소</button>
            <button className="btn-primary" onClick={handleSend} disabled={sending}>
              {sending ? <><Loader2 size={13} className="animate-spin" /> 발송 중...</> : <><Send size={13} /> 보내기</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MessageView ───────────────────────────────────────────────────
function MessageView({ uid, folder, onClose, onReply }: {
  uid: number; folder: string; onClose: () => void;
  onReply: (to: string, subject: string) => void;
}) {
  const [mail,    setMail]    = useState<MailDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/mail/messages/${uid}?folder=${encodeURIComponent(folder)}`)
      .then((r) => setMail(r.data))
      .catch(() => toast.error('메일을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [uid, folder]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={20} className="animate-spin text-zinc-400" />
    </div>
  );
  if (!mail) return null;

  return (
    <div className="flex flex-col h-full">
      {/* toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
        <button className="btn-ghost gap-1.5 text-xs" onClick={onClose}>
          <ArrowLeft size={13} /> 목록
        </button>
        <div className="ml-auto flex gap-1.5">
          <button
            className="btn-secondary text-xs gap-1.5"
            onClick={() => onReply(addrStr(mail.from), `Re: ${mail.subject}`)}
          >
            <Reply size={12} /> 답장
          </button>
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4">{mail.subject}</h1>
        <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-700">
          <p><span className="font-semibold text-zinc-600 dark:text-zinc-300 w-10 inline-block">보낸이</span> {addrStr(mail.from)}</p>
          <p><span className="font-semibold text-zinc-600 dark:text-zinc-300 w-10 inline-block">받는이</span> {mail.to.map(addrStr).join(', ')}</p>
          {mail.cc.length > 0 && <p><span className="font-semibold text-zinc-600 dark:text-zinc-300 w-10 inline-block">CC</span> {mail.cc.map(addrStr).join(', ')}</p>}
          <p><span className="font-semibold text-zinc-600 dark:text-zinc-300 w-10 inline-block">날짜</span>
            {mail.date ? formatDate(mail.date, 'yyyy.MM.dd HH:mm') : ''}
          </p>
        </div>
        {mail.body.includes('<') ? (
          <iframe
            srcDoc={mail.body}
            className="w-full min-h-96 border-0 rounded-xl"
            sandbox="allow-same-origin"
            title="mail-body"
          />
        ) : (
          <pre className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed font-sans">{mail.body}</pre>
        )}

        {mail.attachments?.length > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip size={13} className="text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                첨부파일 {mail.attachments.length}개
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mail.attachments.map((att, i) => {
                const Icon = attachIcon(att.contentType);
                return (
                  <button
                    key={i}
                    onClick={() => downloadAttachment(att)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors text-left max-w-xs"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-zinc-500 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100 truncate max-w-[160px]">{att.filename}</p>
                      <p className="text-[10px] text-zinc-400">{formatBytes(att.size)}</p>
                    </div>
                    <Download size={12} className="text-zinc-400 shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MailPage (main) ───────────────────────────────────────────────
export function MailPage() {
  const currentUser = useAuthStore(s => s.currentUser);
  const email       = currentUser?.email ?? '';

  const [connected,      setConnected]      = useState<boolean | null>(null);
  const [folders,        setFolders]        = useState<Folder[]>([]);
  const [activeFolder,   setActiveFolder]   = useState('INBOX');
  const [messages,       setMessages]       = useState<MailSummary[]>([]);
  const [total,          setTotal]          = useState(0);
  const [unseen,         setUnseen]         = useState(0);
  const [page,           setPage]           = useState(1);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [selectedUid,    setSelectedUid]    = useState<number | null>(null);
  const [checkedUids,    setCheckedUids]    = useState<Set<number>>(new Set());
  const [deleting,       setDeleting]       = useState(false);
  const [composeOpen,    setComposeOpen]    = useState(false);
  const [composeTo,      setComposeTo]      = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const LIMIT = 20;

  // 초기 연결 상태 확인
  useEffect(() => {
    api.get('/mail/status').then((r) => setConnected(r.data.connected)).catch(() => setConnected(false));
  }, []);

  // 폴더 목록
  const loadFolders = useCallback(async () => {
    try {
      const r = await api.get('/mail/folders');
      setFolders(r.data);
    } catch { /* ignore */ }
  }, []);

  // 메시지 목록
  const loadMessages = useCallback(async (folder = activeFolder, p = page) => {
    setLoadingMsgs(true);
    try {
      const r = await api.get<MessagesResult>(`/mail/messages?folder=${encodeURIComponent(folder)}&page=${p}&limit=${LIMIT}`);
      setMessages(r.data.messages);
      setTotal(r.data.total);
      setUnseen(r.data.unseen);
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? '메일을 불러오지 못했습니다.');
    } finally {
      setLoadingMsgs(false);
    }
  }, [activeFolder, page]);

  // 연결 완료 시
  useEffect(() => {
    if (connected) {
      loadFolders();
      loadMessages();
    }
  }, [connected]);

  function handleConnected() { setConnected(true); }

  async function handleDisconnect() {
    await api.post('/mail/disconnect').catch(() => {});
    setConnected(false);
    setMessages([]);
    setFolders([]);
    setSelectedUid(null);
    toast.info('메일 연결이 해제됐습니다.');
  }

  function handleFolderClick(path: string) {
    setActiveFolder(path);
    setPage(1);
    setSelectedUid(null);
    setCheckedUids(new Set());
    loadMessages(path, 1);
  }

  function handlePageChange(delta: number) {
    const newPage = page + delta;
    setPage(newPage);
    setCheckedUids(new Set());
    loadMessages(activeFolder, newPage);
  }

  function toggleCheck(uid: number, e: React.MouseEvent) {
    e.stopPropagation();
    setCheckedUids((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }

  function toggleAll() {
    if (checkedUids.size === messages.length) {
      setCheckedUids(new Set());
    } else {
      setCheckedUids(new Set(messages.map((m) => m.uid)));
    }
  }

  async function handleBulkDelete() {
    if (!checkedUids.size) return;
    setDeleting(true);
    try {
      await api.delete(`/mail/messages?folder=${encodeURIComponent(activeFolder)}`, {
        data: { uids: [...checkedUids] },
      });
      toast.success(`${checkedUids.size}개 메일을 삭제했습니다.`);
      if (selectedUid && checkedUids.has(selectedUid)) setSelectedUid(null);
      setCheckedUids(new Set());
      loadMessages(activeFolder, page);
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? '삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  function openReply(to: string, subject: string) {
    setComposeTo(to);
    setComposeSubject(subject);
    setSelectedUid(null);
    setComposeOpen(true);
  }

  // 연결 상태 확인 중
  if (connected === null) return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="메일" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-zinc-300" />
      </div>
    </div>
  );

  // 미연결
  if (!connected) return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="메일" />
      <div className="flex-1 overflow-y-auto">
        <ConnectScreen onConnect={handleConnected} />
      </div>
    </div>
  );

  const totalPages = Math.ceil(total / LIMIT);
  const folderLabel = folders.find(f => f.path === activeFolder)?.name ?? activeFolder;

  // ── 3단 레이아웃 ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="메일"
        subtitle={email}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-primary gap-1.5 text-xs" onClick={() => { setComposeTo(''); setComposeSubject(''); setComposeOpen(true); }}>
              <Pen size={12} /> 메일 쓰기
            </button>
            <button className="btn-secondary text-xs gap-1.5" onClick={() => loadMessages()}>
              <RefreshCw size={12} /> 새로고침
            </button>
            <button className="btn-ghost text-xs gap-1.5 text-red-500 hover:bg-red-50" onClick={handleDisconnect}>
              <LogOut size={12} /> 연결 해제
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── 폴더 패널 ── */}
        <aside className="w-44 shrink-0 border-r border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-y-auto py-3 px-2">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-2 mb-2">폴더</p>
          {folders.length === 0 && (
            <p className="text-xs text-zinc-400 px-2">폴더 없음</p>
          )}
          {folders.map((f) => (
            <button
              key={f.path}
              onClick={() => handleFolderClick(f.path)}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors w-full',
                activeFolder === f.path
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              )}
            >
              {f.path === 'INBOX' ? <Inbox size={13} /> : <Mail size={13} />}
              <span className="truncate">{f.name}</span>
              {f.path === 'INBOX' && unseen > 0 && (
                <span className={cn(
                  'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                  activeFolder === f.path ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900',
                )}>
                  {unseen}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* ── 메시지 목록 ── */}
        <div className={cn(
          'border-r border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden transition-all',
          selectedUid ? 'w-72 shrink-0' : 'flex-1',
        )}>
          {/* 툴바 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-700 shrink-0">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer shrink-0"
              checked={messages.length > 0 && checkedUids.size === messages.length}
              ref={(el) => { if (el) el.indeterminate = checkedUids.size > 0 && checkedUids.size < messages.length; }}
              onChange={toggleAll}
            />
            {checkedUids.size > 0 ? (
              <>
                <span className="text-xs text-zinc-500 flex-1">{checkedUids.size}개 선택됨</span>
                <button
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  onClick={handleBulkDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  삭제
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex-1">{folderLabel}</span>
                <span className="text-[11px] text-zinc-400">{total}개</span>
              </>
            )}
          </div>

          {/* 리스트 */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={20} className="animate-spin text-zinc-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Mail size={28} className="text-zinc-200" />
                <p className="text-xs text-zinc-400">메일이 없습니다.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.uid}
                  onClick={() => setSelectedUid(m.uid)}
                  className={cn(
                    'flex items-start gap-2.5 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer',
                    selectedUid === m.uid && 'bg-zinc-50 dark:bg-zinc-800',
                    checkedUids.has(m.uid) && 'bg-zinc-100/70 dark:bg-zinc-700/70',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 w-3.5 h-3.5 rounded accent-zinc-900 cursor-pointer shrink-0"
                    checked={checkedUids.has(m.uid)}
                    onClick={(e) => toggleCheck(m.uid, e)}
                    onChange={() => {}}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!m.seen && <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-white shrink-0" />}
                      <p className={cn('text-xs truncate flex-1', m.seen ? 'text-zinc-500 font-normal' : 'text-zinc-900 dark:text-zinc-50 font-semibold')}>
                        {addrStr(m.from) || '(보낸이 없음)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className={cn('text-xs truncate flex-1', m.seen ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-200 font-medium')}>
                        {m.subject}
                      </p>
                      {m.hasAttachments && <Paperclip size={10} className="text-zinc-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-zinc-300 mt-1">
                      {m.date ? formatDate(m.date, 'MM/dd HH:mm') : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-700 shrink-0">
              <button
                className="btn-ghost text-xs py-1 px-2"
                onClick={() => handlePageChange(-1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-xs text-zinc-400">{page} / {totalPages}</span>
              <button
                className="btn-ghost text-xs py-1 px-2"
                onClick={() => handlePageChange(1)}
                disabled={page >= totalPages}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* ── 메일 본문 ── */}
        {selectedUid ? (
          <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
            <MessageView
              uid={selectedUid}
              folder={activeFolder}
              onClose={() => setSelectedUid(null)}
              onReply={openReply}
            />
          </div>
        ) : (
          <div className="flex-1 hidden lg:flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                <Mail size={24} className="text-zinc-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400">메일을 선택하세요</p>
            </div>
          </div>
        )}
      </div>

      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          defaultTo={composeTo}
          defaultSubject={composeSubject}
        />
      )}
    </div>
  );
}
