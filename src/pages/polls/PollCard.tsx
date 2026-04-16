import { CheckCircle2, Clock, Lock, BarChart2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import type { Poll } from '../../types';

interface Props {
  poll: Poll;
}

function calcDday(dueDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const diff = new Date(dueDate).getTime() - new Date(today).getTime();
  return Math.round(diff / 86_400_000);
}

export function PollCard({ poll }: Props) {
  const currentUserId = useAuthStore(s => s.currentUser?.id ?? '');
  const castVote      = useAppStore(s => s.castVote);
  const retractVote   = useAppStore(s => s.retractVote);
  const closePoll     = useAppStore(s => s.closePoll);
  const deletePoll    = useAppStore(s => s.deletePoll);

  const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0);

  const myVotes = poll.options
    .filter((o) => o.voterIds.includes(currentUserId))
    .map((o) => o.id);
  const hasVoted = myVotes.length > 0;

  const showResults =
    poll.status === 'closed' ||
    poll.showResultsBeforeClose ||
    hasVoted;

  function handleVote(optionId: string) {
    if (poll.status === 'closed') return;
    const alreadyVoted = myVotes.includes(optionId);
    if (!poll.isMultiple && alreadyVoted) return;
    if (alreadyVoted) {
      retractVote(poll.id, optionId).catch(console.error);
    } else {
      castVote(poll.id, optionId).catch(console.error);
    }
  }

  const isAuthor = poll.authorId === currentUserId;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {poll.status === 'closed' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                <CheckCircle2 size={10} /> 종료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                <Clock size={10} /> 진행 중
              </span>
            )}
            {poll.dueDate && poll.status === 'active' && (() => {
              const d = calcDday(poll.dueDate!);
              return (
                <span className={cn(
                  'text-[11px] font-semibold',
                  d <= 0 ? 'text-red-500' : d <= 3 ? 'text-amber-600' : 'text-slate-400',
                )}>
                  {d > 0 ? `D-${d}` : d === 0 ? 'D-Day' : `D+${Math.abs(d)}`}
                </span>
              );
            })()}
            <span className="text-[11px] text-slate-400">
              {poll.isMultiple ? '복수 선택' : '단일 선택'}
            </span>
            <span className="text-[11px] text-slate-400">{totalVotes}표</span>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{poll.title}</h3>
          {poll.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{poll.description}</p>
          )}
        </div>

        {isAuthor && poll.status === 'active' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => closePoll(poll.id)}
              className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              수동 마감
            </button>
            <button
              onClick={() => { if (window.confirm(`"${poll.title}" 투표를 삭제하시겠습니까?`)) deletePoll(poll.id); }}
              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
              title="삭제"
            >
              <X size={14} />
            </button>
          </div>
        )}
        {isAuthor && poll.status === 'closed' && (
          <button
            onClick={() => { if (window.confirm(`"${poll.title}" 투표를 삭제하시겠습니까?`)) deletePoll(poll.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors shrink-0"
            title="삭제"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 선택지 목록 */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = totalVotes === 0 ? 0 : Math.round((opt.voterIds.length / totalVotes) * 100);
          const isMyVote = myVotes.includes(opt.id);
          const canVote  = poll.status === 'active';

          return (
            <div key={opt.id} className="space-y-1">
              <div className="flex items-center gap-2">
                {canVote ? (
                  <button
                    onClick={() => handleVote(opt.id)}
                    className={cn(
                      'w-4 h-4 flex-shrink-0 border-2 flex items-center justify-center transition-colors',
                      poll.isMultiple ? 'rounded' : 'rounded-full',
                      isMyVote
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-slate-300 hover:border-primary-400',
                    )}
                    aria-label={`${opt.label} 선택`}
                  >
                    {isMyVote && (
                      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white">
                        <polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    {isMyVote && <CheckCircle2 size={14} className="text-primary-500" />}
                  </div>
                )}

                <span className={cn(
                  'text-xs flex-1',
                  isMyVote ? 'font-semibold text-primary-700' : 'text-slate-700',
                )}>
                  {opt.label}
                </span>

                {showResults && (
                  <span className="text-xs text-slate-400 w-8 text-right shrink-0">{pct}%</span>
                )}
              </div>

              {showResults ? (
                <div className="ml-6 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      isMyVote ? 'bg-primary-500' : 'bg-slate-300',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : (
                !hasVoted && poll.status === 'active' && (
                  <div className="ml-6 h-1.5 rounded-full bg-slate-100" />
                )
              )}
            </div>
          );
        })}
      </div>

      {/* 결과 비공개 안내 */}
      {!showResults && poll.status === 'active' && !hasVoted && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
          <Lock size={11} />
          <span>투표 후 결과를 확인할 수 있습니다</span>
        </div>
      )}
      {!showResults && poll.status === 'active' && hasVoted && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
          <BarChart2 size={11} />
          <span>투표에 참여했습니다. 마감 후 결과가 공개됩니다.</span>
        </div>
      )}
    </div>
  );
}
