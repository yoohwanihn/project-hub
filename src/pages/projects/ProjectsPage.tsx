import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Calendar, Users } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AvatarGroup } from '../../components/ui/Avatar';
import { MOCK_PROJECTS } from '../../data/mock';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

type ViewMode = 'grid' | 'list';

export function ProjectsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('grid');
  const [query, setQuery] = useState('');

  const filtered = MOCK_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="프로젝트"
        subtitle={`총 ${MOCK_PROJECTS.length}개 프로젝트`}
        actions={
          <button className="btn-primary">
            <Plus size={14} /> 새 프로젝트
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
              placeholder="프로젝트 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9 text-sm"
            />
          </div>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
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

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDate(p.updatedAt, 'MM.dd')} 업데이트
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-snug mb-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{p.description}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">진행률</span>
                    <span className="text-xs font-semibold text-slate-700">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} />
                </div>

                {/* Task counts */}
                <div className="flex items-center gap-3 mb-4">
                  {[
                    { label: '진행전', count: p.taskCounts.todo, color: 'text-slate-500' },
                    { label: '진행중', count: p.taskCounts.in_progress, color: 'text-blue-600' },
                    { label: '검토중', count: p.taskCounts.review, color: 'text-amber-600' },
                    { label: '완료', count: p.taskCounts.done, color: 'text-emerald-600' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="text-center">
                      <p className={`text-sm font-bold ${color}`}>{count}</p>
                      <p className="text-[10px] text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={11} />
                    {formatDate(p.endDate)} 마감
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={11} className="text-slate-400" />
                    <AvatarGroup users={p.members} max={3} size="xs" />
                  </div>
                </div>
              </div>
            ))}

            {/* New Project Card */}
            <button className="card p-5 border-dashed border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-600 min-h-[200px]">
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                <Plus size={18} />
              </div>
              <span className="text-xs font-medium">새 프로젝트 추가</span>
            </button>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">프로젝트명</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">진행률</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">마감일</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">팀원</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3">업무 현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-2 w-28">
                        <ProgressBar value={p.progress} color={p.color} className="flex-1" />
                        <span className="text-xs text-slate-500 w-8">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-600">{formatDate(p.endDate)}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <AvatarGroup users={p.members} max={4} size="xs" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">{p.taskCounts.in_progress} 진행중</span>
                        <span className="text-emerald-600">{p.taskCounts.done} 완료</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
