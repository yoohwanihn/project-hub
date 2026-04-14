import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, FolderKanban,
  ArrowRight, Plus, Circle, Link2, TrendingUp, BarChart2,
} from 'lucide-react';
import { Header }      from '../../components/layout/Header';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar, AvatarGroup } from '../../components/ui/Avatar';
import { TagBadge }    from '../../components/ui/Badge';
import { useAppStore, getProjectProgress } from '../../store/useAppStore';
import { formatDate, timeAgo, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { TimelineEvent } from '../../types';

// ── helpers ───────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

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

// ── DonutChart ────────────────────────────────────────────────────
interface DonutSegment { value: number; color: string; label: string }

function DonutChart({ segments, centerLabel }: { segments: DonutSegment[]; centerLabel?: string }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = 32;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  const gap = 2; // px gap between segments

  let rotation = -90; // start from top

  return (
    <svg viewBox="0 0 88 88" className="w-full h-full">
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
      ) : (
        segments.map((seg, i) => {
          if (seg.value === 0) return null;
          const pct  = seg.value / total;
          const dash = Math.max(0, pct * circumference - gap);
          const thisRotation = rotation;
          rotation += pct * 360;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(${thisRotation} ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
        })
      )}
      {/* Inner circle (white) */}
      <circle cx={cx} cy={cy} r={r - 10} fill="white" />
      {/* Center text */}
      <text x={cx} y={cx - 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1e293b">
        {total}
      </text>
      <text x={cx} y={cx + 9} textAnchor="middle" fontSize="6.5" fill="#94a3b8">
        {centerLabel ?? '전체'}
      </text>
    </svg>
  );
}

// ── CompletionTrend (line chart) ──────────────────────────────────
function CompletionTrend({ data }: { data: { date: string; count: number }[] }) {
  const W = 280;
  const H = 72;
  const padL = 6;
  const padR = 6;
  const padT = 8;
  const padB = 18;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => d.count));

  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(1, data.length - 1)) * chartW,
    y: padT + chartH - (d.count / maxVal) * chartH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1]?.x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${padL} ${(padT + chartH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={padL}
          y1={padT + chartH * (1 - t)}
          x2={W - padR}
          y2={padT + chartH * (1 - t)}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}
      {/* Area fill */}
      {pts.length > 1 && <path d={areaPath} fill="#3b82f615" />}
      {/* Line */}
      {pts.length > 1 && (
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
      ))}
      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % 3 !== 0) return null;
        const x = padL + (i / Math.max(1, data.length - 1)) * chartW;
        return (
          <text key={d.date} x={x} y={H - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">
            {d.date.slice(8)}
          </text>
        );
      })}
    </svg>
  );
}

// ── PriorityBars ──────────────────────────────────────────────────
const PRIORITY_COLORS_HEX: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#3b82f6',
  low:    '#94a3b8',
};

function PriorityBars({ data }: { data: { priority: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2.5">
      {data.map(({ priority, count }) => (
        <div key={priority} className="flex items-center gap-2">
          <span className="text-xs text-slate-500 w-10 text-right flex-shrink-0">
            {PRIORITY_LABEL[priority as keyof typeof PRIORITY_LABEL]}
          </span>
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width:           `${Math.max(2, (count / max) * 100)}%`,
                backgroundColor: PRIORITY_COLORS_HEX[priority],
              }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-4 flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── BurndownMini ──────────────────────────────────────────────────
function BurndownMini({ data }: { data: { date: string; remaining: number }[] }) {
  const W = 280;
  const H = 72;
  const padL = 6;
  const padR = 6;
  const padT = 8;
  const padB = 18;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(1, ...data.map((d) => d.remaining));

  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(1, data.length - 1)) * chartW,
    y: padT + chartH - (d.remaining / maxVal) * chartH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1]?.x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${padL} ${(padT + chartH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={padL} y1={padT + chartH * (1 - t)} x2={W - padR} y2={padT + chartH * (1 - t)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      {pts.length > 1 && <path d={areaPath} fill="#10b98115" />}
      {pts.length > 1 && (
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill="white" stroke="#10b981" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => {
        if (i % 3 !== 0) return null;
        const x = padL + (i / Math.max(1, data.length - 1)) * chartW;
        return (
          <text key={d.date} x={x} y={H - 2} textAnchor="middle" fontSize="7" fill="#94a3b8">
            {d.date.slice(8)}
          </text>
        );
      })}
    </svg>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────
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

  const myTasks = useMemo(
    () => allTasks.filter((t) => t.assigneeIds.includes(currentUserId) && t.statusId !== 'done').slice(0, 5),
    [allTasks, currentUserId],
  );

  const dueToday = allTasks.filter((t) => t.dueDate === TODAY && t.statusId !== 'done');
  const overdue  = allTasks.filter((t) => t.dueDate && t.dueDate < TODAY && t.statusId !== 'done');

  const stats = [
    {
      label: '진행 중 업무',
      value: allTasks.filter((t) => t.statusId === 'in_progress').length,
      icon:  Clock,
      color: 'text-blue-600',
      bg:    'bg-blue-50',
      ring:  'ring-blue-100',
    },
    {
      label: '검토 중 업무',
      value: allTasks.filter((t) => t.statusId === 'review').length,
      icon:  AlertCircle,
      color: 'text-amber-600',
      bg:    'bg-amber-50',
      ring:  'ring-amber-100',
    },
    {
      label: '완료한 업무',
      value: allTasks.filter((t) => t.statusId === 'done').length,
      icon:  CheckCircle2,
      color: 'text-emerald-600',
      bg:    'bg-emerald-50',
      ring:  'ring-emerald-100',
    },
    {
      label: '참여 프로젝트',
      value: allProjects.filter((p) => p.members.some((m) => m.id === currentUserId)).length,
      icon:  FolderKanban,
      color: 'text-violet-600',
      bg:    'bg-violet-50',
      ring:  'ring-violet-100',
    },
  ];

  // ── Chart data ───────────────────────────────────────────────
  // Status distribution (donut)
  // Use workflow from first project or fallback colors
  const statusDistribution = useMemo(() => {
    const statusMap = new Map<string, DonutSegment>();
    for (const task of allTasks) {
      const wf = projects[task.projectId]?.workflow.find((w) => w.id === task.statusId);
      if (!wf) continue;
      if (!statusMap.has(wf.id)) statusMap.set(wf.id, { value: 0, color: wf.color, label: wf.label });
      statusMap.get(wf.id)!.value += 1;
    }
    return Array.from(statusMap.values());
  }, [allTasks, projects]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const counts: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    for (const t of allTasks) if (t.statusId !== 'done') counts[t.priority] = (counts[t.priority] ?? 0) + 1;
    return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
  }, [allTasks]);

  // Completion trend (last 14 days)
  const completionTrend = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = addDays(TODAY, -i);
      const count = timeline.filter(
        (e) => e.type === 'task_completed' && e.createdAt.startsWith(date),
      ).length;
      days.push({ date, count });
    }
    return days;
  }, [timeline]);

  // Burndown: remaining non-done tasks trend (simulated from timeline)
  const burndownData = useMemo(() => {
    const totalNonDone = allTasks.filter((t) => t.statusId !== 'done').length;
    const completed    = allTasks.filter((t) => t.statusId === 'done').length;
    // Build burndown: start 14 days ago, track completions
    const days: { date: string; remaining: number }[] = [];
    let remaining = totalNonDone + completed; // approximate total at start
    for (let i = 13; i >= 0; i--) {
      const date = addDays(TODAY, -i);
      const completedOnDay = timeline.filter(
        (e) => e.type === 'task_completed' && e.createdAt.startsWith(date),
      ).length;
      remaining = Math.max(0, remaining - completedOnDay);
      days.push({ date, remaining });
    }
    return days;
  }, [allTasks, timeline]);

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

        {/* ── Stats row ──────────────────────────────────────── */}
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

        {/* ── Charts row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

          {/* Completion Trend */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-blue-500" />
              <h3 className="text-sm font-bold text-slate-800">업무 완료 추이</h3>
              <span className="ml-auto text-xs text-slate-400">최근 14일</span>
            </div>
            <CompletionTrend data={completionTrend} />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>총 완료: <span className="font-semibold text-emerald-600">{completionTrend.reduce((s, d) => s + d.count, 0)}건</span></span>
              <span>일 평균: <span className="font-semibold text-blue-600">
                {(completionTrend.reduce((s, d) => s + d.count, 0) / 14).toFixed(1)}건
              </span></span>
            </div>
          </div>

          {/* Status Donut */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={14} className="text-violet-500" />
              <h3 className="text-sm font-bold text-slate-800">업무 상태 분포</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <DonutChart segments={statusDistribution} centerLabel="전체 업무" />
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {statusDistribution.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-xs text-slate-600 truncate flex-1">{seg.label}</span>
                    <span className="text-xs font-semibold text-slate-800 flex-shrink-0">{seg.value}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0 w-8 text-right">
                      {allTasks.length > 0 ? Math.round((seg.value / allTasks.length) * 100) : 0}%
                    </span>
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={14} className="text-orange-500" />
              <h3 className="text-sm font-bold text-slate-800">우선순위 분포</h3>
              <span className="ml-auto text-xs text-slate-400">미완료 기준</span>
            </div>
            <PriorityBars data={priorityDistribution} />
            {overdue.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs text-red-600 font-medium">지연된 업무 {overdue.length}건</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom content row ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: My Tasks + Project Progress */}
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
                    const isOverdue = task.dueDate && task.dueDate < TODAY;

                    return (
                      <div
                        key={task.id}
                        className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
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
                                'text-xs font-medium',
                                isOverdue ? 'text-red-500' : 'text-slate-400',
                              )}>
                                {isOverdue ? '⚠ ' : ''}{formatDate(task.dueDate)} 마감
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
                      className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                          <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} color={p.color} />
                      </div>
                      <AvatarGroup users={p.members} max={3} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Burndown Mini */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800">번다운 추이</h3>
                <span className="ml-auto text-xs text-slate-400">최근 14일</span>
              </div>
              <BurndownMini data={burndownData} />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>남은 업무: <span className="font-semibold text-slate-700">{allTasks.filter(t => t.statusId !== 'done').length}건</span></span>
                <span>완료율: <span className="font-semibold text-emerald-600">
                  {allTasks.length > 0 ? Math.round((allTasks.filter(t => t.statusId === 'done').length / allTasks.length) * 100) : 0}%
                </span></span>
              </div>
            </div>

            {/* Due today */}
            <div className="card">
              <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">오늘 마감</h2>
                {dueToday.length > 0 && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {dueToday.length}건
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                {dueToday.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">오늘 마감 업무가 없습니다. 🎉</p>
                ) : (
                  dueToday.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => navigate(`/projects/${t.projectId}`)}
                    >
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
