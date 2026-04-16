import { useState, useEffect } from 'react';
import {
  Plus, Clock, ChevronRight, BookOpen, History,
  Pencil, Trash2, Check, X, Eye, EyeOff, FileText,
} from 'lucide-react';
import { Header }         from '../../components/layout/Header';
import { Avatar }         from '../../components/ui/Avatar';
import { ConfirmDialog }  from '../../components/ui/Modal';
import { useAppStore }    from '../../store/useAppStore';
import { useAuthStore }   from '../../store/useAuthStore';
import { formatDate, timeAgo } from '../../lib/utils';
import type { WikiPage as WikiPageType } from '../../types';

// ── Markdown renderer ─────────────────────────────────────────────
function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-slate-800 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-lg font-bold text-slate-900 mb-3">$1</h1>')
    .replace(/```(\w*)\n([\s\S]*?)```/gm, '<pre class="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto my-3 font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g,   '<code class="bg-slate-100 text-primary-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/^- (.+)$/gm,   '<li class="text-sm text-slate-700 mb-1">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
    .replace(/\n\n/g, '<br/><br/>');
}

// ── NewPageModal ──────────────────────────────────────────────────
function NewPageModal({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void; onSubmit: (title: string) => void;
}) {
  const [title, setTitle] = useState('');
  useEffect(() => { if (open) setTitle(''); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-4 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">새 위키 페이지</h2>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">페이지 제목</label>
        <input
          className="input w-full"
          placeholder="예: API 가이드, 온보딩 문서…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && onSubmit(title.trim())}
          autoFocus
        />
        <div className="flex gap-2 mt-5 justify-end">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" disabled={!title.trim()} onClick={() => title.trim() && onSubmit(title.trim())}>생성</button>
        </div>
      </div>
    </div>
  );
}

// ── WikiPage ──────────────────────────────────────────────────────
export function WikiPage() {
  const allWiki             = useAppStore(s => s.wikiPages);
  const users               = useAppStore(s => s.users);
  const selectedProjectIdRaw = useAppStore(s => s.selectedProjectId);
  const selectedProjectId   = selectedProjectIdRaw ?? '';
  const createWikiPage      = useAppStore(s => s.createWikiPage);
  const updateWikiPage      = useAppStore(s => s.updateWikiPage);
  const deleteWikiPage      = useAppStore(s => s.deleteWikiPage);
  const currentUserId       = useAuthStore(s => s.currentUser?.id ?? '');

  const wikiPages = Object.values(allWiki)
    .filter((w) => w.projectId === selectedProjectId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [isEditing,    setIsEditing]    = useState(false);
  const [splitView,    setSplitView]    = useState(true);
  const [editTitle,    setEditTitle]    = useState('');
  const [editContent,  setEditContent]  = useState('');
  const [showNew,      setShowNew]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WikiPageType | null>(null);

  const page = selectedId
    ? (allWiki[selectedId] ?? wikiPages[0] ?? null)
    : (wikiPages[0] ?? null);

  function startEdit() {
    if (!page) return;
    setEditTitle(page.title);
    setEditContent(page.content);
    setIsEditing(true);
  }

  function cancelEdit() { setIsEditing(false); }

  function saveEdit() {
    if (!page || !editTitle.trim()) return;
    updateWikiPage(page.id, {
      title:     editTitle.trim(),
      content:   editContent,
      version:   page.version + 1,
      authorId:  currentUserId,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  }

  function handleCreate(title: string) {
    const id = createWikiPage({
      projectId: selectedProjectId,
      title,
      content:   `# ${title}\n\n여기에 내용을 작성하세요.\n`,
      version:   1,
      authorId:  currentUserId,
      updatedAt: new Date().toISOString(),
    });
    setSelectedId(id);
    setShowNew(false);
    const created = useAppStore.getState().wikiPages[id];
    if (created) { setEditTitle(created.title); setEditContent(created.content); setIsEditing(true); }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const remaining = wikiPages.filter((w) => w.id !== deleteTarget.id);
    deleteWikiPage(deleteTarget.id);
    setSelectedId(remaining[0]?.id ?? null);
    setDeleteTarget(null);
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="위키"
        subtitle="프로젝트 지식 베이스"
        actions={<button className="btn-primary" onClick={() => setShowNew(true)}><Plus size={14} /> 새 페이지</button>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              페이지 목록 <span className="text-slate-300 font-normal normal-case">({wikiPages.length})</span>
            </p>
            <div className="space-y-0.5">
              {wikiPages.length === 0 && <p className="text-xs text-slate-400 text-center py-6">페이지가 없습니다.</p>}
              {wikiPages.map((wp) => (
                <button
                  key={wp.id}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    page?.id === wp.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => { setSelectedId(wp.id); if (isEditing) cancelEdit(); }}
                >
                  <BookOpen size={13} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate flex-1">{wp.title}</span>
                  <ChevronRight size={10} className="flex-shrink-0 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {!page ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <FileText size={36} className="text-slate-200" />
              <p className="text-sm text-slate-400">페이지를 선택하거나 새로 만드세요.</p>
              <button className="btn-primary text-xs" onClick={() => setShowNew(true)}><Plus size={12} /> 새 페이지</button>
            </div>
          ) : isEditing ? (
            /* EDIT MODE */
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50 shrink-0">
                <input
                  className="input flex-1 font-semibold text-slate-900 py-2"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="페이지 제목"
                />
                <button
                  className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                    splitView ? 'bg-primary-50 text-primary-600 border-primary-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setSplitView((v) => !v)}
                >
                  {splitView ? <EyeOff size={13} /> : <Eye size={13} />} 미리보기
                </button>
                <button className="btn-secondary flex items-center gap-1.5 text-xs" onClick={cancelEdit}><X size={13} /> 취소</button>
                <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={saveEdit} disabled={!editTitle.trim()}><Check size={13} /> 저장</button>
              </div>

              {/* Editor + Preview split */}
              <div className={`flex-1 overflow-hidden flex ${splitView ? 'divide-x divide-slate-100' : ''}`}>
                <div className={`flex flex-col overflow-hidden ${splitView ? 'w-1/2' : 'w-full'}`}>
                  <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">마크다운</span>
                  </div>
                  <textarea
                    className="flex-1 resize-none px-6 py-5 text-sm text-slate-700 font-mono leading-relaxed focus:outline-none"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="# 제목&#10;&#10;내용을 마크다운으로 작성하세요..."
                    spellCheck={false}
                  />
                </div>
                {splitView && (
                  <div className="w-1/2 flex flex-col overflow-hidden">
                    <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">미리보기</span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                      <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* READ MODE */
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">
                <div className="mb-6 pb-5 border-b border-slate-100">
                  <h1 className="text-xl font-bold text-slate-900 mb-3">{page.title}</h1>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      {users[page.authorId] && <Avatar name={users[page.authorId].name} size="xs" />}
                      <span>{users[page.authorId]?.name ?? '알 수 없음'}</span>
                    </div>
                    <div className="flex items-center gap-1"><Clock size={11} /><span>{timeAgo(page.updatedAt)}</span></div>
                    <div className="flex items-center gap-1"><History size={11} /><span>v{page.version}</span></div>
                    <span className="text-slate-300">|</span>
                    <span>{formatDate(page.updatedAt, 'yyyy.MM.dd HH:mm')}</span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }} />
                <div className="mt-10 pt-5 border-t border-slate-100 flex items-center gap-2">
                  <button className="btn-primary flex items-center gap-1.5" onClick={startEdit}><Pencil size={13} /> 편집</button>
                  <button
                    className="btn-secondary flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:border-red-200"
                    onClick={() => setDeleteTarget(page)}
                  ><Trash2 size={13} /> 삭제</button>
                  <span className="ml-auto text-xs text-slate-400">버전 {page.version} · {timeAgo(page.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewPageModal open={showNew} onClose={() => setShowNew(false)} onSubmit={handleCreate} />
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="페이지 삭제"
        description={`"${deleteTarget?.title}" 페이지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        danger
      />
    </div>
  );
}
