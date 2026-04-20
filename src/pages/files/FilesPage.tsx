import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Search, FileText, Image, File, Download,
  Trash2, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown,
  FolderOpen,
} from 'lucide-react';
import { Header }        from '../../components/layout/Header';
import { Avatar }        from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAppStore }   from '../../store/useAppStore';
import { useAuthStore }  from '../../store/useAuthStore';
import { formatDate, formatBytes, cn } from '../../lib/utils';
import type { FileItem } from '../../types';

// ── helpers ───────────────────────────────────────────────────────
function fileIcon(mimeType: string, size = 20) {
  if (mimeType.startsWith('image/'))           return <Image     size={size} className="text-zinc-500"    />;
  if (mimeType.includes('pdf'))                return <FileText  size={size} className="text-red-500"     />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
                                               return <FileText  size={size} className="text-zinc-500" />;
  if (mimeType.includes('presentation'))       return <FileText  size={size} className="text-zinc-400"   />;
  if (mimeType.includes('word') || mimeType.includes('document'))
                                               return <FileText  size={size} className="text-zinc-600"    />;
  return <File size={size} className="text-zinc-400" />;
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
  const allFiles             = useAppStore(s => s.files);
  const users                = useAppStore(s => s.users);
  const selectedProjectIdRaw = useAppStore(s => s.selectedProjectId);
  const selectedProjectId    = selectedProjectIdRaw ?? '';
  const uploadFiles          = useAppStore(s => s.uploadFiles);
  const deleteFile           = useAppStore(s => s.deleteFile);
  const loadProjectData      = useAppStore(s => s.loadProjectData);
  const accessToken          = useAuthStore(s => s.accessToken);

  // 페이지 진입 또는 프로젝트 전환 시 데이터 보장
  useEffect(() => {
    if (selectedProjectId) loadProjectData(selectedProjectId);
  }, [selectedProjectId]);

  async function downloadFile(f: FileItem) {
    try {
      const res = await fetch(`/api/files/${f.id}/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = f.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드에 실패했습니다. 로그인 상태를 확인해주세요.');
    }
  }

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
    if (sortKey !== k) return <ArrowUpDown size={12} className="text-zinc-300" />;
    return sortDir === 'asc'
      ? <ArrowUp   size={12} className="text-zinc-700" />
      : <ArrowDown size={12} className="text-zinc-700" />;
  }

  // ── file upload ────────────────────────────────────────────
  function processFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    uploadFiles(selectedProjectId, fileList).catch(console.error);
  }

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [selectedProjectId]);

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
            <Search size={13} className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
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
          <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 ml-auto">
            <button
              className={cn('px-3 py-2 transition-colors', view === 'grid' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700')}
              onClick={() => setView('grid')}
              title="그리드 보기"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={cn('px-3 py-2 transition-colors', view === 'list' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700')}
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
              ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-700'
              : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800',
          )}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className={cn(
            'mx-auto mb-2 transition-colors',
            isDragging ? 'text-zinc-700 dark:text-zinc-200' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500',
          )} />
          <p className={cn('text-sm transition-colors', isDragging ? 'text-zinc-900 dark:text-zinc-50 font-medium' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100')}>
            {isDragging ? '여기에 놓으세요!' : '여기에 파일을 드래그하거나 클릭하여 업로드'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">모든 파일 형식 지원 · 최대 100MB</p>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen size={36} className="text-zinc-200 dark:text-zinc-700" />
            <p className="text-sm text-zinc-400">
              {query || filterType ? '검색 결과가 없습니다.' : '업로드된 파일이 없습니다.'}
            </p>
          </div>
        )}

        {/* List view */}
        {view === 'list' && filtered.length > 0 && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="text-left px-5 py-3">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => toggleSort('name')}
                    >
                      파일명 <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => toggleSort('size')}
                    >
                      크기 <SortIcon k="size" />
                    </button>
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-4 py-3 hidden lg:table-cell">업로더</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    <button
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      onClick={() => toggleSort('createdAt')}
                    >
                      날짜 <SortIcon k="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer group transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {fileIcon(f.mimeType)}
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{f.name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{fileExt(f.name)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-xs text-zinc-500 dark:text-zinc-400">
                      {formatBytes(f.size)}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {users[f.uploaderId] && <Avatar name={users[f.uploaderId].name} size="xs" />}
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">{users[f.uploaderId]?.name ?? '알 수 없음'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(f.createdAt, 'yyyy.MM.dd HH:mm')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                          title="다운로드"
                          onClick={() => downloadFile(f)}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500"
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
                <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-700 flex items-center justify-center">
                  {fileIcon(f.mimeType, 22)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate" title={f.name}>{f.name}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{formatBytes(f.size)}</p>
                  <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-0.5">{formatDate(f.createdAt, 'yyyy.MM.dd')}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    onClick={() => downloadFile(f)}
                  >
                    <Download size={12} />
                  </button>
                  <button
                    className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500"
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
