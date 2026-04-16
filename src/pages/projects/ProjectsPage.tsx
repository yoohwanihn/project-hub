import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Calendar, Users, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { AvatarGroup } from '../../components/ui/Avatar';
import { ConfirmDialog } from '../../components/ui/Modal';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { useAppStore, getProjectProgress } from '../../store/useAppStore';
import { formatDate, cn } from '../../lib/utils';
import type { Project } from '../../types';

type ViewMode = 'grid' | 'list';

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects      = useAppStore(s => s.projects);
  const tasks         = useAppStore(s => s.tasks);
  const deleteProject = useAppStore(s => s.deleteProject);

  const [view,    setView]    = useState<ViewMode>('grid');
  const [query,   setQuery]   = useState('');
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [menuId,      setMenuId]      = useState<string | null>(null);

  const projectList = Object.values(projects)
    .filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  function getTaskCounts(projectId: string) {
    const pts = Object.values(tasks).filter((t) => t.projectId === projectId);
    const project = projects[projectId];
    const counts: Record<string, number> = {};
    for (const s of project?.workflow ?? []) counts[s.id] = 0;
    for (const t of pts) counts[t.statusId] = (counts[t.statusId] ?? 0) + 1;
    return { counts, tasks: pts };
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <Header
          title="프로젝트"
          subtitle={`총 ${projectList.length}개 프로젝트`}
          actions={
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
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
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white ml-auto">
              <button
                className={cn('px-3 py-2 transition-colors', view === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => setView('grid')}
              ><LayoutGrid size={14} /></button>
              <button
                className={cn('px-3 py-2 transition-colors', view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-50')}
                onClick={() => setView('list')}
              ><List size={14} /></button>
            </div>
          </div>

          {/* Grid View */}
          {view === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {projectList.map((p) => {
                const { counts, tasks: pts } = getTaskCounts(p.id);
                const progress = getProjectProgress(pts);
                const firstStatuses = p.workflow.slice().sort((a, b) => a.order - b.order).slice(0, 4);

                return (
                  <div
                    key={p.id}
                    className="card p-5 cursor-pointer hover:shadow-md transition-shadow group relative"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    {/* Context menu */}
                    <button
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.stopPropagation(); setMenuId(menuId === p.id ? null : p.id); }}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {menuId === p.id && (
                      <div
                        className="absolute top-10 right-3 w-32 bg-white border border-slate-200 rounded-xl shadow-modal z-50 py-1"
                        onClick={(e) => e.stopPropagation()}
                        onMouseLeave={() => setMenuId(null)}
                      >
                        <button
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50"
                          onClick={() => { setMenuId(null); setEditProject(p); }}
                        >
                          <Pencil size={12} className="text-slate-400" /> 수정
                        </button>
                        <button
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600"
                          onClick={() => { setMenuId(null); setDeleteId(p.id); }}
                        >
                          <Trash2 size={12} /> 삭제
                        </button>
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-snug truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(p.updatedAt, 'MM.dd')} 업데이트</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{p.description}</p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">진행률</span>
                        <span className="text-xs font-semibold text-slate-700">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} color={p.color} />
                    </div>

                    {/* Status counts */}
                    <div className="flex items-center gap-2 mb-4">
                      {firstStatuses.map((s) => (
                        <div key={s.id} className="text-center flex-1">
                          <p className="text-sm font-bold" style={{ color: s.color }}>{counts[s.id] ?? 0}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.label}</p>
                        </div>
                      ))}
                    </div>

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
                );
              })}

              <button
                className="card p-5 border-dashed border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-600 min-h-[200px]"
                onClick={() => setCreateOpen(true)}
              >
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
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projectList.map((p) => {
                    const { tasks: pts } = getTaskCounts(p.id);
                    const progress = getProjectProgress(pts);
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-2 w-28">
                            <ProgressBar value={progress} color={p.color} className="flex-1" />
                            <span className="text-xs text-slate-500 w-8">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-slate-600">
                          {formatDate(p.endDate)}
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <AvatarGroup users={p.members} max={4} size="xs" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                              onClick={() => setEditProject(p)}
                            ><Pencil size={13} /></button>
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                              onClick={() => setDeleteId(p.id)}
                            ><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ProjectModal open={!!editProject} onClose={() => setEditProject(null)} project={editProject ?? undefined} />
      <ConfirmDialog
        open={!!deleteId}
        title="프로젝트 삭제"
        description={`"${projects[deleteId!]?.name}" 프로젝트와 모든 업무가 삭제됩니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { deleteProject(deleteId!); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
