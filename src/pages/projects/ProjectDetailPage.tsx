import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Columns3, GanttChartSquare, BookOpen, Paperclip, Plus, MoreHorizontal } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_ANNOUNCEMENTS } from '../../data/mock';
import { formatDate, timeAgo, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL, cn } from '../../lib/utils';

const SHORTCUTS = [
  { icon: Columns3,         label: '칸반 보드', to: '/kanban' },
  { icon: GanttChartSquare, label: '간트차트',  to: '/gantt' },
  { icon: BookOpen,         label: '위키',      to: '/wiki' },
  { icon: Paperclip,        label: '파일',      to: '/files' },
];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = MOCK_PROJECTS.find((p) => p.id === id);

  if (!project) return (
    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
      프로젝트를 찾을 수 없습니다.
    </div>
  );

  const tasks = MOCK_TASKS.filter((t) => t.projectId === id);
  const announcements = MOCK_ANNOUNCEMENTS.filter((a) => a.projectId === id);
  const totalTasks = Object.values(project.taskCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title={project.name}
        subtitle={project.description}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => navigate('/projects')}>
              <ArrowLeft size={14} /> 목록
            </button>
            <button className="btn-primary">
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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h2 className="text-base font-bold text-slate-900">{project.name}</h2>
                </div>
                <p className="text-xs text-slate-500">{project.description}</p>
              </div>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600">전체 진행률</span>
                <span className="text-lg font-bold" style={{ color: project.color }}>{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} color={project.color} className="h-2" />
            </div>

            {/* Task status breakdown */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: '진행 전', count: project.taskCounts.todo,        color: 'text-slate-600', bg: 'bg-slate-50' },
                { label: '진행 중', count: project.taskCounts.in_progress, color: 'text-blue-700',  bg: 'bg-blue-50' },
                { label: '검토 중', count: project.taskCounts.review,      color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: '완료',    count: project.taskCounts.done,        color: 'text-emerald-700', bg: 'bg-emerald-50' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${bg}`}>
                  <p className={`text-xl font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Info row */}
            <div className="flex items-center gap-6 text-xs text-slate-500 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{formatDate(project.startDate)} ~ {formatDate(project.endDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={12} />
                <span>{project.members.length}명</span>
                <AvatarGroup users={project.members} max={5} size="xs" />
              </div>
            </div>
          </div>

          {/* Shortcuts + Announcements */}
          <div className="space-y-4">
            {/* Quick nav */}
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

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3">공지사항</p>
                <div className="space-y-2.5">
                  {announcements.map((a) => (
                    <div key={a.id} className={cn('p-3 rounded-xl border text-xs', a.isPinned ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100')}>
                      <div className="flex items-start gap-1.5">
                        {a.isPinned && <span className="text-amber-500">📌</span>}
                        <div>
                          <p className="font-semibold text-slate-700">{a.title}</p>
                          <p className="text-slate-500 mt-1 line-clamp-2">{a.content}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                            <Avatar name={a.author.name} size="xs" />
                            <span>{a.author.name}</span>
                            <span>·</span>
                            <span>{timeAgo(a.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Task list */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">업무 목록 ({totalTasks})</h2>
            <button className="btn-primary text-xs py-1.5">
              <Plus size={12} /> 업무 추가
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.map((task) => (
              <div key={task.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors">
                <span className={cn('badge w-16 justify-center', STATUS_COLOR[task.status])}>
                  {STATUS_LABEL[task.status]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.tags.map((tag) => (
                      <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                  </div>
                </div>
                <span className={cn('badge', PRIORITY_COLOR[task.priority])}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-slate-400 hidden md:block">
                    {formatDate(task.dueDate)} 마감
                  </span>
                )}
                <AvatarGroup users={task.assignees} max={2} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
