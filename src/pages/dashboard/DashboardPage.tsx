import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, FolderKanban,
  ArrowRight, Plus, Circle, Link2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { useAppStore, getProjectProgress } from '../../store/useAppStore';
import { formatDate, timeAgo, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { TimelineEvent } from '../../types';

function timelineMessage(e: TimelineEvent, actorName: string): React.ReactNode {
  const bold = (s: string) => <span className="font-semibold text-slate-800">{s}</span>;
  const em   = (s: string) => <span className="font-medium">{s}</span>;
  switch (e.type) {
    case 'task_completed': return <>{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;업무를 완료했습니다.</>;
    case 'task_created':   return <>{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;업무를 생성했습니다.</>;
    case 'task_updated':   return <>{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;{e.payload.field === 'status' ? '상태를' : '우선순위를'}&nbsp;변경했습니다.</>;
    case 'task_deleted':   return <>{bold(actorName)}님이 업무를 삭제했습니다.</>;
    case 'comment_added':  return <>{bold(actorName)}님이 댓글을 남겼습니다.</>;
    case 'file_uploaded':  return <>{bold(actorName)}님이 {em(`"${String(e.payload.fileName)}"`)}&nbsp;파일을 업로드했습니다.</>;
    case 'member_joined':  return <>{bold(actorName)}님이 프로젝트에 합류했습니다.</>;
    case 'project_created':return <>{bold(actorName)}님이 새 프로젝트를 생성했습니다.</>;
    default: return null;
  }
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { projects, tasks, users, timeline, currentUserId } = useAppStore((s) => ({
    projects:      s.projects,
    tasks:         s.tasks,
    users:         s.users,
    timeline:      s.timeline,
    currentUserId: s.currentUserId,
  }));

  const allTasks    = useMemo(() => Object.values(tasks), [tasks]);
  const allProjects = useMemo(() => Object.values(projects), [projects]);
  const currentUser = users[currentUserId];

  const myTasks = allTasks.filter(
    (t) => t.assigneeIds.includes(currentUserId) && t.statusId !== 'done',
  ).slice(0, 5);

  const TODAY = '2026-04-13';
  const dueToday = allTasks.filter((t) => t.dueDate === TODAY && t.statusId !== 'done');

  const stats = [
    {
      label: '진행 중 업무',
      value: allTasks.filter((t) => t.statusId === 'in_progress').length,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '검토 중 업무',
      value: allTasks.filter((t) => t.statusId === 'review').length,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '완료한 업무',
      value: allTasks.filter((t) => t.statusId === 'done').length,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: '참여 프로젝트',
      value: allProjects.filter((p) => p.members.some((m) => m.id === currentUserId)).length,
      icon: FolderKanban,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="대시보드"
        subtitle={currentUser ? `안녕하세요, ${currentUser.name}님` : ''}
        actions={
          <button className="btn-primary" onClick={() => navigate('/projects')}>
            <Plus size={14} /> 새 업무
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* My Tasks */}
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">내 업무</h2>
                <button
                  className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                  onClick={() => navigate('/kanban')}
                >
                  전체 보기 <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {myTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">할당된 업무가 없습니다. 🎉</p>
                ) : (
                  myTasks.map((task) => {
                    const project = projects[task.projectId];
                    const status  = project?.workflow.find((s) => s.id === task.statusId);
                    const tags    = task.tagIds.map((id) => project?.tags.find((t) => t.id === id)).filter(Boolean);

                    return (
                      <div
                        key={task.id}
                        className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => navigate(`/projects/${task.projectId}`)}
                      >
                        <Circle size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {status && (
                              <span
                                className="badge"
                                style={{ backgroundColor: `${status.color}20`, color: status.color }}
                              >
                                {status.label}
                              </span>
                            )}
                            <span className={cn('badge', PRIORITY_COLOR[task.priority])}>
                              {PRIORITY_LABEL[task.priority]}
                            </span>
                            {task.dueDate && (
                              <span className={cn(
                                'text-xs',
                                task.dueDate < TODAY ? 'text-red-500 font-semibold' : 'text-slate-400',
                              )}>
                                {formatDate(task.dueDate)} 마감
                              </span>
                            )}
                            {task.blockedBy.length > 0 && (
                              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                <Link2 size={9} /> 선행 {task.blockedBy.length}개
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {tags.map((tag) => tag && <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Project Progress */}
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">프로젝트 현황</h2>
                <button
                  className="text-xs text-primary-600 font-medium hover:underline flex items-center gap-1"
                  onClick={() => navigate('/projects')}
                >
                  전체 보기 <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {allProjects.map((p) => {
                  const pts      = allTasks.filter((t) => t.projectId === p.id);
                  const progress = getProjectProgress(pts);
                  return (
                    <div
                      key={p.id}
                      className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                        <ProgressBar value={progress} color={p.color} className="mt-1.5" />
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">{progress}%</span>
                      <AvatarGroup users={p.members} max={3} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Due today */}
            <div className="card">
              <div className="px-4 py-3.5 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">오늘 마감</h2>
              </div>
              <div className="p-4 space-y-2">
                {dueToday.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">오늘 마감 업무가 없습니다. 🎉</p>
                ) : (
                  dueToday.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-slate-700 font-medium truncate">{t.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity feed */}
            <div className="card">
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">최근 활동</h2>
                <button
                  className="text-xs text-primary-600 font-medium hover:underline"
                  onClick={() => navigate('/timeline')}
                >
                  더 보기
                </button>
              </div>
              <div className="p-4 space-y-3.5">
                {timeline.slice(0, 6).map((e) => {
                  const actor = users[e.actorId];
                  if (!actor) return null;
                  return (
                    <div key={e.id} className="flex gap-3">
                      <Avatar name={actor.name} size="xs" className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {timelineMessage(e, actor.name)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
