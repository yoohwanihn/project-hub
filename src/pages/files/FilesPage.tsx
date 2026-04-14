import { useState, useRef, useCallback } from 'react';
import {
  Upload, Search, FileText, Image, File, Download,
  Trash2, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown,
  FolderOpen,
} from 'lucide-react';
import { Header }        from '../../components/layout/Header';
import { Avatar }        from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAppStore }   from '../../store/useAppStore';
import { formatDate, formatBytes, cn } from '../../lib/utils';
import type { FileItem } from '../../types';

// ── helpers ───────────────────────────────────────────────────────
function fileIcon(mimeType: string, size = 20) {
  if (mimeType.startsWith('image/'))           return <Image     size={size} className="text-blue-500"    />;
  if (mimeType.includes('pdf'))                return <FileText  size={size} className="text-red-500"     />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
                                               return <FileText  size={size} className="text-emerald-600" />;
  if (mimeType.includes('presentation'))       return <FileText  size={size} className="text-amber-500"   />;
  if (mimeType.includes('word') || mimeType.includes('document'))
                                               return <FileText  size={size} className="text-blue-600"    />;
  return <File size={size} className="text-slate-400" />;
}

function fileExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? '';
}

function mimeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/'))     return 'image';
  if (mimeType.includes('pdf'))          return 'pdf';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))       return 'spreadsheet';
  if (mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('word') || mimeType.includes('document'))     return 'document';
  return 'other';
}

type SortKey = 'name' | 'size' | 'createdAt';
type SortDir = 'asc' | 'desc';

const FILTER_OPTIONS = [
  { value: '',             label: '전체' },
  { value: 'image',        label: '이미지' },
  { value: 'pdf',          label: 'PDF' },
  { value: 'document',     label: '문서' },
  { value: 'spreadsheet',  label: '스프레드시트' },
  { value: 'presentation', label: '프레젠테이션' },
];

// ── FilesPage ─────────────────────────────────────────────────────
export function FilesPage() {
  const { files: allFiles, users, selectedProjectId, currentUserId, addFile, deleteFile } = useAppStore((s) => ({
    files:             s.files,
    users:             s.users,
    selectedProjectId: s.selectedProjectId ?? 'p1',
    currentUserId:     s.currentUserId,
    addFile:           s.addFile,
    deleteFile:        s.deleteFile,
  }));

  const files = Object.values(allFiles).filter((f) => f.projectId === selectedProjectId);

  const [query,        setQuery]        = useState('');
  const [view,         setView]         = useState<'grid' | 'list'>('list');
  const [sortKey,      setSortKey]      = useState<SortKey>('createdAt');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  const [filterType,   setFilterType]   = useState('');
  const [isDragging,   setIsDragging]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── sort / filter ──────────────────────────────────────────
  const filtered = files
    .filter((f) => {
      const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase());
      const matchesType  = !filterType || mimeCategory(f.mimeType) === filterType;
      return matchesQuery && matchesType;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')      cmp = a.name.localeCompare(b.name);
      if (sortKey === 'size')      cmp = a.size - b.size;
      if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ArrowUp   size={12} className="text-primary-500" />
      : <ArrowDown size={12} className="text-primary-500" />;
  }

  // ── file upload (simulated) ────────────────────────────────
  function processFiles(fileList: FileList | null) {
    if (!fileList) return;
    for (const f of Array.from(fileList)) {
      addFile({
        projectId:  selectedProjectId,
        name:       f.name,
        size:       f.size,
        mimeType:   f.type || 'application/octet-stream',
        uploaderId: currentUserId,
      });
    }
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [selectedProjectId, currentUserId]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteFile(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="파일 보관함"
        subtitle={`${files.length}개 파일 · ${formatBytes(files.reduce((s, f) => s + f.size, 0))}`}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => processFiles(e.target.files)}
            />
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> 파일 업로드
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="파일 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9 text-sm w-full"
            />
          </div>

          {/* Type filter */}
          <select
            className="input text-xs w-36"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white ml-auto">
            <button
              className={cn('px-3 py-2 transition-colors', view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
              onClick={() => setView('grid')}
              title="그리드 보기"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={cn('px-3 py-2 transition-colors', view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
              onClick={() => setView('list')}
              title="목록 보기"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center mb-5 transition-all cursor-pointer group',
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/50',
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className={cn(
            'mx-auto mb-2 transition-colors',
            isDragging ? 'text-primary-500' : 'text-slate-300 group-hover:text-primary-400',
          )} />
          <p className={cn('text-sm transition-colors', isDragging ? 'text-primary-600 font-medium' : 'text-slate-500 group-hover:text-primary-600')}>
            {isDragging ? '여기에 놓으세요!' : '여기에 파일을 드래그하거나 클릭하여 업로드'}
          </p>
          <p className="text-xs text-slate-400 mt-1">모든 파일 형식 지원 · 최대 100MB</p>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen size={36} className="text-slate-200" />
            <p className="text-sm text-slate-400">
              {query || filterType ? '검색 결과가 없습니다.' : '업로드된 파일이 없습니다.'}
            </p>
          </div>
        )}

        {/* List view */}
        {view === 'list' && filtered.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('name')}
                    >
                      파일명 <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('size')}
                    >
                      크기 <SortIcon k="size" />
                    </button>
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">업로더</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => toggleSort('createdAt')}
                    >
                      날짜 <SortIcon k="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {fileIcon(f.mimeType)}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{f.name}</p>
                          <p className="text-xs text-slate-400">{fileExt(f.name)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-slate-500">
                      {formatBytes(f.size)}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {users[f.uploaderId] && <Avatar name={users[f.uploaderId].name} size="xs" />}
                        <span className="text-xs text-slate-600">{users[f.uploaderId]?.name ?? '알 수 없음'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-500">
                      {formatDate(f.createdAt, 'yyyy.MM.dd HH:mm')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="다운로드"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="삭제"
                          onClick={() => setDeleteTarget(f)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid view */}
        {view === 'grid' && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="card p-4 cursor-pointer hover:shadow-md transition-all group flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  {fileIcon(f.mimeType, 22)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-medium text-slate-700 truncate" title={f.name}>{f.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatBytes(f.size)}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">{formatDate(f.createdAt, 'yyyy.MM.dd')}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <Download size={12} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    onClick={() => setDeleteTarget(f)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="파일 삭제"
        description={`"${deleteTarget?.name}" 파일을 삭제하시겠습니까?`}
        danger
      />
    </div>
  );
}
