import { CheckCircle2, MessageSquare, Upload, UserPlus, FilePlus, Edit, Trash2, FolderKanban } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { formatDate, timeAgo } from '../../lib/utils';
import type { TimelineEvent } from '../../types';

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  task_completed:  { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50',  label: '업무 완료' },
  task_created:    { icon: FilePlus,      color: 'text-blue-600',    bg: 'bg-blue-50',     label: '업무 생성' },
  task_updated:    { icon: Edit,          color: 'text-amber-600',   bg: 'bg-amber-50',    label: '업무 수정' },
  task_deleted:    { icon: Trash2,        color: 'text-red-500',     bg: 'bg-red-50',      label: '업무 삭제' },
  comment_added:   { icon: MessageSquare, color: 'text-violet-600',  bg: 'bg-violet-50',   label: '댓글 추가' },
  file_uploaded:   { icon: Upload,        color: 'text-cyan-600',    bg: 'bg-cyan-50',     label: '파일 업로드' },
  member_joined:   { icon: UserPlus,      color: 'text-pink-600',    bg: 'bg-pink-50',     label: '멤버 합류' },
  project_created: { icon: FolderKanban,  color: 'text-primary-600', bg: 'bg-primary-50',  label: '프로젝트 생성' },
};

function Message({ e, actorName }: { e: TimelineEvent; actorName: string }) {
  const bold = (s: string) => <span className="font-semibold text-slate-800">{s}</span>;
  const em   = (s: string) => <span className="font-medium text-slate-700">{s}</span>;

  switch (e.type) {
    case 'task_completed':  return <p className="text-sm text-slate-700">{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;업무를 완료했습니다.</p>;
    case 'task_created':    return <p className="text-sm text-slate-700">{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;업무를 생성했습니다.</p>;
    case 'task_deleted':    return <p className="text-sm text-slate-700">{bold(actorName)}님이 업무를 삭제했습니다.</p>;
    case 'task_updated':    return <p className="text-sm text-slate-700">{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;{e.payload.field === 'status' ? '상태를' : '정보를'}&nbsp;변경했습니다.</p>;
    case 'file_uploaded':   return <p className="text-sm text-slate-700">{bold(actorName)}님이 {em(`"${String(e.payload.fileName)}"`)}&nbsp;파일을 업로드했습니다.</p>;
    case 'member_joined':   return <p className="text-sm text-slate-700">{bold(actorName)}님이 프로젝트에 합류했습니다. 👋</p>;
    case 'project_created': return <p className="text-sm text-slate-700">{bold(actorName)}님이 새 프로젝트를 생성했습니다.</p>;
    case 'comment_added':
      return (
        <div>
          <p className="text-sm text-slate-700">{bold(actorName)}님이 {em(`"${String(e.payload.taskTitle)}"`)}&nbsp;에 댓글을 남겼습니다.</p>
          {e.payload.comment && (
            <blockquote className="mt-1.5 pl-3 border-l-2 border-slate-200 text-slate-500 text-xs italic">
              {String(e.payload.comment)}
            </blockquote>
          )}
        </div>
      );
    default: return null;
  }
}

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
  const { timeline, users } = useAppStore((s) => ({
    timeline: s.timeline,
    users:    s.users,
  }));

  const grouped = groupByDate(timeline);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="타임라인" subtitle="프로젝트 활동 피드" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {grouped.map(([date, events]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
                  {formatDate(date, 'yyyy년 MM월 dd일')}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-3">
                {events.map((e) => {
                  const cfg      = EVENT_CONFIG[e.type] ?? EVENT_CONFIG.task_updated;
                  const Icon     = cfg.icon;
                  const actor    = users[e.actorId];
                  if (!actor) return null;

                  return (
                    <div key={e.id} className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                          <Icon size={14} className={cfg.color} />
                        </div>
                      </div>

                      <div className="card p-4 flex-1">
                        <div className="flex items-start gap-3">
                          <Avatar name={actor.name} size="sm" className="flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <Message e={e} actorName={actor.name} />
                            <p className="text-xs text-slate-400 mt-1">{timeAgo(e.createdAt)}</p>
                          </div>
                          <span className={`badge flex-shrink-0 text-xs ${cfg.bg} ${cfg.color}`}>
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

          {grouped.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-16">아직 활동이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
