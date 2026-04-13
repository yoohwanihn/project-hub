import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../data/mock';
import { STATUS_COLOR, STATUS_LABEL, cn } from '../../lib/utils';
import type { Task } from '../../types';

// ── helpers ──────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function addDays(date: string, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_W = 36; // px per day

const PROJECT_COLOR_MAP: Record<string, string> = {
  todo:        '#94a3b8',
  in_progress: '#3b82f6',
  review:      '#f59e0b',
  done:        '#10b981',
};

// ── sub‑components ───────────────────────────────────────────────
function GanttBar({ task, start, days }: { task: Task; start: string; days: number }) {
  if (!task.startDate || !task.dueDate) return null;

  const offset = Math.max(0, daysBetween(start, task.startDate));
  const width  = Math.max(1, daysBetween(task.startDate, task.dueDate) + 1);

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md flex items-center px-2 cursor-pointer group transition-opacity hover:opacity-90"
      style={{
        left:   offset * CELL_W + 4,
        width:  width  * CELL_W - 8,
        backgroundColor: PROJECT_COLOR_MAP[task.status],
      }}
      title={`${task.title} (${task.startDate} ~ ${task.dueDate})`}
    >
      <span className="text-[11px] text-white font-medium truncate">{task.title}</span>
      {/* resize handles (visual only) */}
      <div className="absolute left-1 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-l-md" />
      <div className="absolute right-1 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-r-md" />
    </div>
  );
}

export function GanttPage() {
  const [selectedProject, setSelectedProject] = useState('p1');
  const [startDate, setStartDate]             = useState('2026-03-01');
  const VISIBLE_DAYS = 56; // 8 weeks

  const tasks = MOCK_TASKS.filter((t) => t.projectId === selectedProject);
  const project = MOCK_PROJECTS.find((p) => p.id === selectedProject);

  const days = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(startDate, i));

  function prev() { setStartDate(addDays(startDate, -14)); }
  function next() { setStartDate(addDays(startDate, 14)); }

  const todayIndex = daysBetween(startDate, '2026-04-13');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="간트차트"
        subtitle={project?.name}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input text-xs w-44"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {MOCK_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button className="px-2 py-2 hover:bg-slate-50 transition-colors" onClick={prev}>
                <ChevronLeft size={14} className="text-slate-600" />
              </button>
              <span className="px-2 py-1.5 text-xs text-slate-600 font-medium select-none">
                {startDate.slice(0, 7).replace('-', '년 ') + '월'}
              </span>
              <button className="px-2 py-2 hover:bg-slate-50 transition-colors" onClick={next}>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            </div>
            <button className="btn-primary">
              <Plus size={14} /> 업무 추가
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex">
        {/* Left panel: task list */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {/* Header */}
          <div className="h-16 border-b border-slate-100 px-4 flex items-end pb-2">
            <span className="text-xs font-semibold text-slate-500">업무명</span>
          </div>
          {/* Rows */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="h-12 border-b border-slate-50 px-4 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
                <span className={cn('badge mt-0.5', STATUS_COLOR[task.status])}>
                  {STATUS_LABEL[task.status]}
                </span>
              </div>
              <div className="flex -space-x-1 flex-shrink-0">
                {task.assignees.slice(0, 2).map((u) => (
                  <Avatar key={u.id} name={u.name} size="xs" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: chart area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          {/* Day headers */}
          <div
            className="h-16 border-b border-slate-100 flex sticky top-0 bg-white z-10"
            style={{ minWidth: VISIBLE_DAYS * CELL_W }}
          >
            {days.map((d, i) => {
              const date = new Date(d);
              const isToday = d === '2026-04-13';
              const isSun   = date.getDay() === 0;
              const isSat   = date.getDay() === 6;
              const isFirst = date.getDate() === 1 || i === 0;
              return (
                <div
                  key={d}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center justify-end pb-1.5 border-r border-slate-100 relative',
                    isToday && 'bg-primary-50',
                    (isSun || isSat) && !isToday && 'bg-slate-50',
                  )}
                  style={{ width: CELL_W }}
                >
                  {isFirst && (
                    <span className="absolute top-2 left-1 text-[10px] font-bold text-slate-500">
                      {d.slice(5, 7)}월
                    </span>
                  )}
                  <span className={cn(
                    'text-[11px]',
                    isToday ? 'text-primary-600 font-bold' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-400',
                  )}>
                    {date.getDate()}
                  </span>
                  <span className={cn(
                    'text-[10px]',
                    isToday ? 'text-primary-500' : isSun ? 'text-red-300' : isSat ? 'text-blue-300' : 'text-slate-300',
                  )}>
                    {WEEK_DAYS[date.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Task bars */}
          <div style={{ minWidth: VISIBLE_DAYS * CELL_W }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="h-12 border-b border-slate-50 relative"
                style={{ minWidth: VISIBLE_DAYS * CELL_W }}
              >
                {/* Weekend shading */}
                {days.map((d, i) => {
                  const day = new Date(d).getDay();
                  return (day === 0 || day === 6) ? (
                    <div
                      key={d}
                      className="absolute top-0 bottom-0 bg-slate-50/80"
                      style={{ left: i * CELL_W, width: CELL_W }}
                    />
                  ) : null;
                })}

                {/* Today line */}
                {todayIndex >= 0 && todayIndex < VISIBLE_DAYS && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-primary-400/50 z-10"
                    style={{ left: todayIndex * CELL_W + CELL_W / 2 }}
                  />
                )}

                <GanttBar task={task} start={startDate} days={VISIBLE_DAYS} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2.5 border-t border-slate-100 bg-white flex items-center gap-4">
        {Object.entries(PROJECT_COLOR_MAP).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {STATUS_LABEL[status]}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-px h-3 bg-primary-400" />
          오늘
        </div>
      </div>
    </div>
  );
}
