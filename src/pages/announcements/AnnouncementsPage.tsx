import { useState, useEffect } from 'react';
import {
  Plus, Pin, PinOff, Pencil, Trash2, Search,
  Megaphone, ChevronDown, ChevronUp, X, Check,
} from 'lucide-react';
import { Header }        from '../../components/layout/Header';
import { Avatar }        from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAppStore }   from '../../store/useAppStore';
import { formatDate, timeAgo } from '../../lib/utils';
import { cn }            from '../../lib/utils';
import type { Announcement } from '../../types';

// ── AnnouncementModal ────────────────────────────────────────────
function AnnouncementModal({ open, onClose, onSubmit, initial }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string, isPinned: boolean) => void;
  initial?: Announcement;
}) {
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title   ?? '');
    setContent(initial?.content ?? '');
    setIsPinned(initial?.isPinned ?? false);
  }, [open, initial]);

  if (!open) return null;

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {isEdit ? '공지 편집' : '새 공지사항'}
          </h2>
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">제목 *</label>
            <input
              className="input w-full"
              placeholder="공지사항 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">내용 *</label>
            <textarea
              className="input w-full resize-none leading-relaxed"
              rows={7}
              placeholder="공지사항 내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                isPinned ? 'bg-primary-600 border-primary-600' : 'border-slate-300 hover:border-primary-400',
              )}
              onClick={() => setIsPinned((v) => !v)}
            >
              {isPinned && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm text-slate-700">상단 고정</span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button
            className="btn-primary"
            disabled={!title.trim() || !content.trim()}
            onClick={() => onSubmit(title.trim(), content.trim(), isPinned)}
          >
            {isEdit ? '저장' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AnnouncementCard ─────────────────────────────────────────────
function AnnouncementCard({
  ann, author, onEdit, onDelete, onTogglePin,
}: {
  ann: Announcement;
  author: { name: string } | undefined;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'card overflow-hidden transition-all',
      ann.isPinned && 'ring-2 ring-primary-200',
    )}>
      <div className="px-5 py-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {ann.isPinned && (
            <span className="mt-0.5 flex-shrink-0 px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
              고정
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              {author && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={author.name} size="xs" />
                  <span>{author.name}</span>
                </div>
              )}
              <span>{formatDate(ann.createdAt, 'yyyy.MM.dd')}</span>
              <span>{timeAgo(ann.createdAt)}</span>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors"
              title={ann.isPinned ? '고정 해제' : '상단 고정'}
              onClick={onTogglePin}
            >
              {ann.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              onClick={onEdit}
            >
              <Pencil size={14} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </button>
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Preview / Expanded content */}
        {!expanded ? (
          <p
            className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-2 cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            {ann.content}
          </p>
        ) : (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AnnouncementsPage ────────────────────────────────────────────
export function AnnouncementsPage() {
  const allAnns                = useAppStore(s => s.announcements);
  const users                  = useAppStore(s => s.users);
  const selectedProjectIdRaw   = useAppStore(s => s.selectedProjectId);
  const selectedProjectId      = selectedProjectIdRaw ?? 'p1';
  const currentUserId          = useAppStore(s => s.currentUserId);
  const createAnnouncement     = useAppStore(s => s.createAnnouncement);
  const updateAnnouncement     = useAppStore(s => s.updateAnnouncement);
  const deleteAnnouncement     = useAppStore(s => s.deleteAnnouncement);
  const togglePinAnnouncement  = useAppStore(s => s.togglePinAnnouncement);

  const allList = Object.values(allAnns)
    .filter((a) => a.projectId === selectedProjectId)
    .sort((a, b) => {
      // pinned first, then by date desc
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const [query,        setQuery]        = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const filtered = allList.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.content.toLowerCase().includes(query.toLowerCase()),
  );

  const pinned    = filtered.filter((a) => a.isPinned);
  const unpinned  = filtered.filter((a) => !a.isPinned);

  function handleSubmit(title: string, content: string, isPinned: boolean) {
    if (editTarget) {
      updateAnnouncement(editTarget.id, { title, content, isPinned });
      setEditTarget(null);
    } else {
      createAnnouncement({
        projectId: selectedProjectId,
        title,
        content,
        authorId:  currentUserId,
        isPinned,
      });
    }
    setShowModal(false);
  }

  function openEdit(ann: Announcement) {
    setEditTarget(ann);
    setShowModal(true);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteAnnouncement(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="공지사항"
        subtitle={`${allList.length}개 공지`}
        actions={
          <button className="btn-primary" onClick={() => { setEditTarget(null); setShowModal(true); }}>
            <Plus size={14} /> 새 공지
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="공지사항 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          {query && (
            <span className="text-xs text-slate-400">
              <span className="font-semibold text-slate-700">{filtered.length}</span>개 검색됨
            </span>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Megaphone size={36} className="text-slate-200" />
            <p className="text-sm text-slate-400">
              {query ? '검색 결과가 없습니다.' : '공지사항이 없습니다.'}
            </p>
            {!query && (
              <button className="btn-primary text-xs" onClick={() => setShowModal(true)}>
                <Plus size={12} /> 첫 공지 등록
              </button>
            )}
          </div>
        )}

        {/* Pinned section */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Pin size={13} className="text-primary-500" />
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">고정된 공지</h2>
            </div>
            <div className="space-y-3">
              {pinned.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  author={users[ann.authorId]}
                  onEdit={() => openEdit(ann)}
                  onDelete={() => setDeleteTarget(ann)}
                  onTogglePin={() => togglePinAnnouncement(ann.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular section */}
        {unpinned.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <Megaphone size={13} className="text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">전체 공지</h2>
              </div>
            )}
            <div className="space-y-3">
              {unpinned.map((ann) => (
                <AnnouncementCard
                  key={ann.id}
                  ann={ann}
                  author={users[ann.authorId]}
                  onEdit={() => openEdit(ann)}
                  onDelete={() => setDeleteTarget(ann)}
                  onTogglePin={() => togglePinAnnouncement(ann.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnnouncementModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        initial={editTarget ?? undefined}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="공지사항 삭제"
        description={`"${deleteTarget?.title}" 공지를 삭제하시겠습니까?`}
        danger
      />
    </div>
  );
}
