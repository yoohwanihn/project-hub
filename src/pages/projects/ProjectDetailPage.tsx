import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Calendar, Columns3, GanttChartSquare,
  BookOpen, Paperclip, Plus, Pencil, Trash2,
  Filter, Link2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { TaskModal } from '../../components/tasks/TaskModal';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { useAppStore, getProjectProgress } from '../../store/useAppStore';
import { formatDate, timeAgo, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { Task } from '../../types';

const SHORTCUTS = [
  { icon: Columns3,         label: '칸반 보드', to: '/kanban' },
  { icon: GanttChartSquare, label: '간트차트',  to: '/gantt' },
  { icon: BookOpen,         label: '위키',      to: '/wiki' },
  { icon: Paperclip,        label: '파일',      to: '/files' },
];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project       = useAppStore(s => s.projects[id!]);
  const tasksMap      = useAppStore(s => s.tasks);
  const users         = useAppStore(s => s.users);
  const announcementsMap = useAppStore(s => s.announcements);
  const deleteTask    = useAppStore(s => s.deleteTask);
  const tasks         = useMemo(() => Object.values(tasksMap).filter((t) => t.projectId === id), [tasksMap, id]);
  const announcements = useMemo(() => Object.values(announcementsMap).filter((a) => a.projectId === id), [announcementsMap, id]);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [addTaskOpen,     setAddTaskOpen]     = useState(false);
  const [editTask,        setEditTask]        = useState<Task | null>(null);
  const [deleteTaskId,    setDeleteTaskId]    = useState<string | null>(null);

  // Filter state
  const [filterStatus,   setFilterStatus]   = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterTagId,    setFilterTagId]    = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');

  const progress = useMemo(() => getProjectProgress(tasks), [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus   && t.statusId !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterTagId    && !t.tagIds.includes(filterTagId)) return false;
      if (filterAssignee && !t.assigneeIds.includes(filterAssignee)) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterTagId, filterAssignee]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        프로젝트를 찾을 수 없습니다.
      </div>
    );
  }

  const workflow = project.workflow.slice().sort((a, b) => a.order - b.order);
  const taskCountByStatus = Object.fromEntries(
    workflow.map((s) => [s.id, tasks.filter((t) => t.statusId === s.id).length]),
  );

  const hasFilter = filterStatus || filterPriority || filterTagId || filterAssignee;

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <Header
          title={project.name}
          subtitle={project.description}
          actions={
            <div className="flex items-center gap-2">
              <button className="btn-ghost" onClick={() => navigate('/projects')}>
                <ArrowLeft size={14} /> 목록
              </button>
              <button
                className="btn-secondary py-1.5"
                onClick={() => setEditProjectOpen(true)}
              >
                <Pencil size={13} /> 편집
              </button>
              <button className="btn-primary" onClick={() => setAddTaskOpen(true)}>
                <Plus size={14} /> 업무 추가
              </button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Summary card */}
            <div className="lg:col-span-2 card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h2 className="text-base font-bold text-slate-900">{project.name}</h2>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">전체 진행률</span>
                  <span className="text-xl font-bold" style={{ color: project.color }}>{progress}%</span>
                </div>
                <ProgressBar value={progress} color={project.color} />
              </div>

              {/* Workflow status counts */}
              <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(workflow.length, 4)}, 1fr)` }}>
                {workflow.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl p-3 text-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${s.color}15` }}
                    onClick={() => setFilterStatus(filterStatus === s.id ? '' : s.id)}
                  >
                    <p className="text-xl font-bold" style={{ color: s.color }}>{taskCountByStatus[s.id] ?? 0}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-500 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={12} />
                  <span>{project.members.length}명</span>
                  <AvatarGroup users={project.members} max={6} size="xs" />
                </div>
              </div>
            </div>

            {/* Shortcuts + Announcements */}
            <div className="space-y-4">
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3">바로가기</p>
                <div className="grid grid-cols-2 gap-2">
                  {SHORTCUTS.map(({ icon: Icon, label, to }) => (
                    <button
                      key={label}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 text-slate-600 transition-colors"
                      onClick={() => navigate(to)}
                    >
                      <Icon size={18} />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {announcements.length > 0 && (
                <div className="card p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-3">공지사항</p>
                  <div className="space-y-2">
                    {announcements.map((a) => {
                      const author = users[a.authorId];
                      return (
                        <div
                          key={a.id}
                          className={cn('p-3 rounded-xl border text-xs', a.isPinned ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100')}
                        >
                          <div className="flex gap-1.5">
                            {a.isPinned && <span className="text-amber-500">📌</span>}
                            <div>
                              <p className="font-semibold text-slate-700">{a.title}</p>
                              <p className="text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                              {author && (
                                <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                                  <Avatar name={author.name} size="xs" />
                                  <span>{author.name}</span>
                                  <span>·</span>
                                  <span>{timeAgo(a.createdAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task List */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-800 flex-shrink-0">
                업무 ({filteredTasks.length}/{tasks.length})
              </h2>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={13} className="text-slate-400" />

                <select
                  className="input text-xs py-1 w-28"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">모든 상태</option>
                  {workflow.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>

                <select
                  className="input text-xs py-1 w-28"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="">모든 우선순위</option>
                  {(['urgent', 'high', 'medium', 'low'] as const).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                  ))}
                </select>

                {project.tags.length > 0 && (
                  <select
                    className="input text-xs py-1 w-28"
                    value={filterTagId}
                    onChange={(e) => setFilterTagId(e.target.value)}
                  >
                    <option value="">모든 태그</option>
                    {project.tags.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}

                <select
                  className="input text-xs py-1 w-28"
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                >
                  <option value="">모든 담당자</option>
                  {project.members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                {hasFilter && (
                  <button
                    className="text-xs text-primary-600 hover:underline"
                    onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterTagId(''); setFilterAssignee(''); }}
                  >
                    초기화
                  </button>
                )}
              </div>

              <button
                className="btn-primary text-xs py-1.5 flex-shrink-0"
                onClick={() => setAddTaskOpen(true)}
              >
                <Plus size={12} /> 추가
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  {hasFilter ? '필터 조건에 맞는 업무가 없습니다.' : '아직 업무가 없습니다.'}
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const status = workflow.find((s) => s.id === task.statusId);
                  const assignees = task.assigneeIds.map((id) => users[id]).filter(Boolean);
                  const tags = task.tagIds.map((id) => project.tags.find((t) => t.id === id)).filter(Boolean);

                  return (
                    <div
                      key={task.id}
                      className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                      onClick={() => setEditTask(task)}
                    >
                      {/* Status badge */}
                      <span
                        className="badge text-xs w-16 justify-center flex-shrink-0"
                        style={status ? { backgroundColor: `${status.color}20`, color: status.color } : {}}
                      >
                        {status?.label ?? task.statusId}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                          {task.blockedBy.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 flex-shrink-0">
                              <Link2 size={9} /> {task.blockedBy.length}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {tags.map((tag) => (
                            <TagBadge key={tag!.id} name={tag!.name} color={tag!.color} />
                          ))}
                        </div>
                      </div>

                      <span className={cn('badge flex-shrink-0', PRIORITY_COLOR[task.priority])}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>

                      {task.dueDate && (
                        <span className="text-xs text-slate-400 hidden md:block flex-shrink-0">
                          {formatDate(task.dueDate)} 마감
                        </span>
                      )}

                      <AvatarGroup users={assignees} max={2} size="xs" />

                      {/* Row actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          onClick={() => setEditTask(task)}
                        ><Pencil size={12} /></button>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                          onClick={() => setDeleteTaskId(task.id)}
                        ><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <ProjectModal open={editProjectOpen} onClose={() => setEditProjectOpen(false)} project={project} />
      <TaskModal open={addTaskOpen} onClose={() => setAddTaskOpen(false)} projectId={id!} />
      <TaskModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        projectId={id!}
        task={editTask ?? undefined}
      />
      <ConfirmDialog
        open={!!deleteTaskId}
        title="업무 삭제"
        description={`"${tasks.find((t) => t.id === deleteTaskId)?.title}" 업무를 삭제합니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { deleteTask(deleteTaskId!); setDeleteTaskId(null); }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </>
  );
}
