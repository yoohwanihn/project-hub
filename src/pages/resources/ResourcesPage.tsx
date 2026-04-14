import { useState, useMemo } from 'react';
import { Users, Clock, BarChart2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Header }    from '../../components/layout/Header';
import { Avatar }    from '../../components/ui/Avatar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { cn }          from '../../lib/utils';

// ── Mini bar chart (SVG) ──────────────────────────────────────────
function MiniBarChart({ data, color = '#3b82f6' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 240, H = 60, barW = Math.floor((W - (data.length - 1) * 4) / data.length);

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full" style={{ height: H + 16 }}>
      {data.map((d, i) => {
        const barH = Math.max(2, Math.round((d.value / max) * H));
        const x = i * (barW + 4);
        const y = H - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="2" fill={color} opacity="0.8" />
            <text x={x + barW / 2} y={H + 13} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="600">
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── ResourcesPage ─────────────────────────────────────────────────
export function ResourcesPage() {
  const { projects, tasks: allTasksMap, workLogs: allWorkLogsMap, selectedProjectId } = useAppStore((s) => ({
    projects:          s.projects,
    tasks:             s.tasks,
    workLogs:          s.workLogs,
    selectedProjectId: s.selectedProjectId ?? 'p1',
  }));

  const projectList = Object.values(projects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const [viewProjectId, setViewProjectId] = useState(selectedProjectId);
  const project   = projects[viewProjectId];
  const allTasks  = useMemo(() => Object.values(allTasksMap).filter((t) => t.projectId === viewProjectId), [allTasksMap, viewProjectId]);
  const allLogs   = useMemo(() => Object.values(allWorkLogsMap), [allWorkLogsMap]);

  // ── Per-member stats ─────────────────────────────────────────
  const memberStats = useMemo(() => {
    return (project?.members ?? []).map((member) => {
      const myTasks   = allTasks.filter((t) => t.assigneeIds.includes(member.id));
      const active    = myTasks.filter((t) => t.statusId !== 'done');
      const done      = myTasks.filter((t) => t.statusId === 'done');
      const taskIds   = new Set(myTasks.map((t) => t.id));
      const myLogs    = allLogs.filter((l) => taskIds.has(l.taskId) && l.userId === member.id);
      const loggedH   = parseFloat(myLogs.reduce((s, l) => s + l.hours, 0).toFixed(1));
      const estimatedH = myTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
      const completionRate = myTasks.length > 0 ? Math.round((done.length / myTasks.length) * 100) : 0;
      const isOverloaded = active.length >= 5;
      return { member, total: myTasks.length, active: active.length, done: done.length, loggedH, estimatedH, completionRate, isOverloaded };
    });
  }, [project, allTasks, allLogs]);

  // ── Project-level time summary ────────────────────────────────
  const projectTimeSummary = useMemo(() => {
    return projectList.map((p) => {
      const pts    = Object.values(allTasksMap).filter((t) => t.projectId === p.id);
      const pLogs  = Object.values(allWorkLogsMap).filter((l) => pts.some((t) => t.id === l.taskId));
      const loggedH    = parseFloat(pLogs.reduce((s, l) => s + l.hours, 0).toFixed(1));
      const estimatedH = pts.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
      const done       = pts.filter((t) => t.statusId === 'done').length;
      const progress   = pts.length > 0 ? Math.round((done / pts.length) * 100) : 0;
      return { project: p, loggedH, estimatedH, progress, taskCount: pts.length };
    });
  }, [projectList, allTasksMap, allWorkLogsMap]);

  // ── Weekly log breakdown (last 7 days) ───────────────────────
  const weeklyLogs = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const dayLogs = allLogs.filter((l) => l.date === dateStr);
      const hours = parseFloat(dayLogs.reduce((s, l) => s + l.hours, 0).toFixed(1));
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return { label: days[d.getDay()], date: dateStr, value: hours };
    });
  }, [allLogs]);

  // ── Task status breakdown for selected project ────────────────
  const statusBreakdown = useMemo(() => {
    const wf = project?.workflow ?? [];
    return wf.map((w) => ({
      ...w,
      count: allTasks.filter((t) => t.statusId === w.id).length,
    }));
  }, [project, allTasks]);

  const totalLogged    = parseFloat(allLogs.filter((l) => allTasks.some((t) => t.id === l.taskId)).reduce((s, l) => s + l.hours, 0).toFixed(1));
  const totalEstimated = allTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const timePct        = totalEstimated > 0 ? Math.round((totalLogged / totalEstimated) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="자원 관리"
        subtitle={project?.name ?? '프로젝트 선택'}
        actions={
          <select
            className="input text-xs w-52"
            value={viewProjectId}
            onChange={(e) => setViewProjectId(e.target.value)}
          >
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── 상단 요약 카드 ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '전체 업무', value: allTasks.length, icon: BarChart2, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: '진행 중',   value: allTasks.filter(t => t.statusId !== 'done').length, icon: Clock,       color: 'text-blue-600',   bg: 'bg-blue-50' },
            { label: '완료',      value: allTasks.filter(t => t.statusId === 'done').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: '기록 시간', value: `${totalLogged}h`, icon: TrendingUp, color: 'text-amber-600',  bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
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

          {/* ── 팀원별 업무 현황 ─────────────────────────────── */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800">팀원별 업무 현황</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {memberStats.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">팀원이 없습니다.</p>
              )}
              {memberStats.map(({ member, total, active, done, loggedH, estimatedH, completionRate, isOverloaded }) => (
                <div key={member.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                        {isOverloaded && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={9} /> 과부하
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 capitalize">{member.role}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        전체 {total}개 · 진행 <span className="text-blue-600 font-medium">{active}</span>개 · 완료 <span className="text-emerald-600 font-medium">{done}</span>개
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">{loggedH}h</p>
                      <p className="text-xs text-slate-400">{estimatedH > 0 ? `/ ${estimatedH}h 예상` : '시간 미설정'}</p>
                    </div>
                  </div>

                  {/* Task progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0">{completionRate}%</span>
                  </div>

                  {/* Time usage bar */}
                  {estimatedH > 0 && (
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            loggedH > estimatedH ? 'bg-red-400' : 'bg-primary-400',
                          )}
                          style={{ width: `${Math.min(100, Math.round((loggedH / estimatedH) * 100))}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">
                        {Math.round((loggedH / estimatedH) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 우측 컬럼 ────────────────────────────────────── */}
          <div className="space-y-4">
            {/* 주간 시간 기록 */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-primary-500" />
                <h3 className="text-sm font-bold text-slate-800">주간 시간 기록</h3>
                <span className="ml-auto text-xs text-slate-400">최근 7일</span>
              </div>
              <MiniBarChart data={weeklyLogs} color="#3b82f6" />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>총 <span className="font-semibold text-slate-700">{weeklyLogs.reduce((s, d) => s + d.value, 0)}h</span></span>
                <span>일평균 <span className="font-semibold text-slate-700">
                  {(weeklyLogs.reduce((s, d) => s + d.value, 0) / 7).toFixed(1)}h
                </span></span>
              </div>
            </div>

            {/* 업무 상태 분포 */}
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={14} className="text-violet-500" />
                <h3 className="text-sm font-bold text-slate-800">업무 상태 분포</h3>
              </div>
              <div className="space-y-2.5">
                {statusBreakdown.map((w) => (
                  <div key={w.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.color }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{w.label}</span>
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: allTasks.length > 0 ? `${Math.round((w.count / allTasks.length) * 100)}%` : '0%',
                          backgroundColor: w.color,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-4 text-right flex-shrink-0">{w.count}</span>
                  </div>
                ))}
              </div>

              {/* Time usage overall */}
              {totalEstimated > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">전체 시간 사용률</span>
                    <span className={cn('font-bold', timePct >= 100 ? 'text-red-500' : 'text-slate-700')}>
                      {totalLogged}h / {totalEstimated}h
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', timePct >= 100 ? 'bg-red-400' : timePct >= 80 ? 'bg-amber-400' : 'bg-primary-400')}
                      style={{ width: `${Math.min(100, timePct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">{timePct}% 사용</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 프로젝트별 시간 리포트 ───────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={14} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">프로젝트별 시간 리포트</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['프로젝트', '업무 수', '진행률', '기록 시간', '예상 시간', '시간 사용률'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectTimeSummary.map(({ project: p, loggedH, estimatedH, progress, taskCount }) => {
                const pct = estimatedH > 0 ? Math.round((loggedH / estimatedH) * 100) : null;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{taskCount}개</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progress} color={p.color} className="w-20" />
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{loggedH}h</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{estimatedH > 0 ? `${estimatedH}h` : '—'}</td>
                    <td className="px-5 py-3.5">
                      {pct !== null ? (
                        <span className={cn('text-xs font-semibold', pct >= 100 ? 'text-red-500' : 'text-slate-700')}>
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
