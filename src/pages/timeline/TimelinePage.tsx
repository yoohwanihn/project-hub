import { CheckCircle2, MessageSquare, Upload, UserPlus, FilePlus, Edit } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { MOCK_TIMELINE } from '../../data/mock';
import { formatDate, timeAgo } from '../../lib/utils';
import type { TimelineEvent } from '../../types';

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  task_completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: '업무 완료' },
  task_created:   { icon: FilePlus,     color: 'text-blue-600',    bg: 'bg-blue-50',    label: '업무 생성' },
  task_updated:   { icon: Edit,         color: 'text-amber-600',   bg: 'bg-amber-50',   label: '업무 수정' },
  comment_added:  { icon: MessageSquare,color: 'text-violet-600',  bg: 'bg-violet-50',  label: '댓글 추가' },
  file_uploaded:  { icon: Upload,       color: 'text-cyan-600',    bg: 'bg-cyan-50',    label: '파일 업로드' },
  member_joined:  { icon: UserPlus,     color: 'text-pink-600',    bg: 'bg-pink-50',    label: '멤버 합류' },
};

function message(e: TimelineEvent): React.ReactNode {
  switch (e.type) {
    case 'task_completed':
      return <><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 <span className="font-medium text-emerald-700">"{String(e.payload.taskTitle)}"</span> 업무를 완료했습니다.</>;
    case 'task_created':
      return <><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 <span className="font-medium text-blue-700">"{String(e.payload.taskTitle)}"</span> 업무를 생성했습니다.</>;
    case 'task_updated':
      return <><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 <span className="font-medium">"{String(e.payload.taskTitle)}"</span> {e.payload.field === 'status' ? `상태를 변경했습니다.` : `우선순위를 변경했습니다.`}</>;
    case 'comment_added':
      return (
        <div>
          <p><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 <span className="font-medium">"{String(e.payload.taskTitle)}"</span>에 댓글을 남겼습니다.</p>
          <blockquote className="mt-1.5 pl-3 border-l-2 border-slate-200 text-slate-500 text-xs italic">
            {String(e.payload.comment)}
          </blockquote>
        </div>
      );
    case 'file_uploaded':
      return <><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 <span className="font-medium text-cyan-700">"{String(e.payload.fileName)}"</span> 파일을 업로드했습니다.</>;
    case 'member_joined':
      return <><span className="font-semibold text-slate-800">{e.actor.name}</span>님이 프로젝트에 합류했습니다. 👋</>;
    default:
      return null;
  }
}

// Group events by date
function groupByDate(events: TimelineEvent[]) {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = e.createdAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

export function TimelinePage() {
  const grouped = groupByDate(MOCK_TIMELINE);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="타임라인" subtitle="프로젝트 활동 피드" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {grouped.map(([date, events]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
                  {formatDate(date, 'yyyy년 MM월 dd일 (eee)')}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Events */}
              <div className="space-y-4">
                {events.map((e) => {
                  const cfg = EVENT_CONFIG[e.type] ?? EVENT_CONFIG.task_updated;
                  const Icon = cfg.icon;
                  return (
                    <div key={e.id} className="flex gap-4">
                      {/* Icon */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                          <Icon size={14} className={cfg.color} />
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px bg-slate-100 h-full" />
                      </div>

                      {/* Content */}
                      <div className="card p-4 flex-1 mb-0">
                        <div className="flex items-start gap-3">
                          <Avatar name={e.actor.name} size="sm" className="flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 leading-relaxed">{message(e)}</p>
                            <p className="text-xs text-slate-400 mt-1">{timeAgo(e.createdAt)}</p>
                          </div>
                          <span className={`badge flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
