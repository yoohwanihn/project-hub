import { useState } from 'react';
import { Upload, Search, FileText, Image, File, Download, Trash2, LayoutGrid, List } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { MOCK_FILES } from '../../data/mock';
import { formatDate, formatBytes, cn } from '../../lib/utils';

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
  if (mimeType.includes('pdf'))       return <FileText size={20} className="text-red-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText size={20} className="text-emerald-600" />;
  if (mimeType.includes('presentation')) return <FileText size={20} className="text-amber-500" />;
  return <File size={20} className="text-slate-400" />;
}

function fileExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? '';
}

export function FilesPage() {
  const [query, setQuery] = useState('');
  const [view, setView]   = useState<'grid' | 'list'>('list');

  const filtered = MOCK_FILES.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="파일 보관함"
        subtitle={`${MOCK_FILES.length}개 파일`}
        actions={
          <button className="btn-primary">
            <Upload size={14} /> 파일 업로드
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="파일 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white ml-auto">
            <button
              className={cn('px-3 py-2 transition-colors', view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className={cn('px-3 py-2 transition-colors', view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
              onClick={() => setView('list')}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-5 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer group">
          <Upload size={24} className="mx-auto text-slate-300 group-hover:text-primary-400 mb-2 transition-colors" />
          <p className="text-sm text-slate-500 group-hover:text-primary-600">여기에 파일을 드래그하거나 클릭하여 업로드</p>
          <p className="text-xs text-slate-400 mt-1">최대 파일 크기: 100MB</p>
        </div>

        {/* List view */}
        {view === 'list' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">파일명</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">크기</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">업로더</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">업로드 날짜</th>
                  <th className="px-4 py-3" />
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
                        <Avatar name={f.uploadedBy.name} size="xs" />
                        <span className="text-xs text-slate-600">{f.uploadedBy.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-500">
                      {formatDate(f.createdAt, 'yyyy.MM.dd HH:mm')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Download size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
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
        {view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="card p-4 cursor-pointer hover:shadow-md transition-shadow group flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  {fileIcon(f.mimeType)}
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatBytes(f.size)}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                    <Download size={12} />
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
