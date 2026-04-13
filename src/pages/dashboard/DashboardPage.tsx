import {
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowRight, Plus, Circle,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_TIMELINE, CURRENT_USER } from '../../data/mock';
import { formatDate, timeAgo, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

// Tasks assigned to me
const MY_TASKS = MOCK_TASKS.filter(
  (t) => t.assignees.some((a) => a.id === CURRENT_USER.id) && t.status !== 'done',
).slice(0, 5);

// Due today / overdue
const TODAY = '2026-04-13';
const DUE_TODAY = MOCK_TASKS.filter((t) => t.dueDate === TODAY && t.status !== 'done');

const STATS = [
  { label: '진행 중 업무', value: MOCK_TASKS.filter((t) => t.status === 'in_progress').length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '검토 중 업무', value: MOCK_TASKS.filter((t) => t.status === 'review').length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: '완료한 업무', value: MOCK_TASKS.filter((t) => t.status === 'done').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: '참여 프로젝트', value: MOCK_PROJECTS.filter((p) => p.members.some((m) => m.id === CURRENT_USER.id)).length, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
];

function timelineMessage(e: (typeof MOCK_TIMELINE)[0]): string {
  switch (e.type) {
    case 'task_completed': return `"${e.payload.taskTitle}" 업무를 완료했습니다.`;
    case 'task_created':   return `"${e.payload.taskTitle}" 업무를 생성했습니다.`;
    case 'task_updated':   return `"${e.payload.taskTitle}" ${e.payload.field === 'status' ? '상태를 변경했습니다.' : '우선순위를 변경했습니다.'}`;
    case 'comment_added':  return `"${e.payload.taskTitle}"에 댓글을 남겼습니다.`;
    case 'file_uploaded':  return `"${e.payload.fileName}" 파일을 업로드했습니다.`;
    case 'member_joined':  return `프로젝트에 합류했습니다.`;
    default: return '';
  }
}

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="대시보드"
        subtitle={`안녕하세요, ${CURRENT_USER.name}님 👋`}
        actions={
          <button className="btn-primary" onClick={() => navigate('/projects')}>
            <Plus size={14} /> 새 업무
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
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
          {/* My Tasks */}
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
                {MY_TASKS.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">할당된 업무가 없습니다.</p>
                ) : (
                  MY_TASKS.map((task) => (
                    <div key={task.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer">
                      <Circle size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge ${STATUS_COLOR[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                          <span className={`badge ${PRIORITY_COLOR[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                          {task.dueDate && (
                            <span className="text-xs text-slate-400">{formatDate(task.dueDate)} 마감</span>
                          )}
                        </div>
                      </div>
                      <div className="flex -space-x-1 mt-0.5">
                        {task.tags.map((tag) => (
                          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project progress */}
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
                {MOCK_PROJECTS.map((p) => (
                  <div
                    key={p.id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <ProgressBar value={p.progress} showLabel className="flex-1" />
                      </div>
                    </div>
                    <AvatarGroup users={p.members} max={3} />
                  </div>
                ))}
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
                {DUE_TODAY.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">오늘 마감 업무가 없습니다. 🎉</p>
                ) : (
                  DUE_TODAY.map((t) => (
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
                {MOCK_TIMELINE.slice(0, 6).map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <Avatar name={e.actor.name} size="xs" className="mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-semibold">{e.actor.name}</span>{' '}
                        {timelineMessage(e)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(e.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
