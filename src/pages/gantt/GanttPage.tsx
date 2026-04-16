import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import { Header }  from '../../components/layout/Header';
import { Avatar }  from '../../components/ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

// ── constants ─────────────────────────────────────────────────────
const TODAY       = new Date().toISOString().slice(0, 10);
const WEEK_DAYS   = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_W      = 36;   // px per day
const ROW_H       = 48;   // px per task row

// ── helpers ───────────────────────────────────────────────────────
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── drag types ────────────────────────────────────────────────────
type DragType = 'move' | 'resize-right';

interface DragState {
  taskId:        string;
  type:          DragType;
  startX:        number;
  origStartDate: string;
  origDueDate:   string;
}

interface BarPreview {
  startDate: string;
  dueDate:   string;
}

// ── GanttBar ─────────────────────────────────────────────────────
interface GanttBarProps {
  task:        Task;
  ganttStart:  string;
  preview?:    BarPreview;
  color:       string;
  isDragging:  boolean;
  onDragStart: (e: React.MouseEvent, type: DragType) => void;
}

function GanttBar({ task, ganttStart, preview, color, isDragging, onDragStart }: GanttBarProps) {
  const sd = preview?.startDate ?? task.startDate;
  const dd = preview?.dueDate   ?? task.dueDate;
  if (!sd || !dd) return null;

  const offset    = daysBetween(ganttStart, sd);
  const spanDays  = Math.max(1, daysBetween(sd, dd) + 1);
  const barLeft   = offset * CELL_W + 4;
  const barWidth  = Math.max(8, spanDays * CELL_W - 8);

  // Don't render if completely outside visible area (negative offset handled by CSS overflow)
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 h-6 rounded-md flex items-center px-2 select-none group',
        isDragging  ? 'cursor-grabbing ring-2 ring-white/60 ring-offset-1 opacity-80' : 'cursor-grab hover:brightness-110',
      )}
      style={{
        left:            barLeft,
        width:           barWidth,
        backgroundColor: color,
        transition:      isDragging ? 'none' : 'filter 0.1s',
        zIndex:          isDragging ? 30 : 1,
      }}
      onMouseDown={(e) => { e.preventDefault(); onDragStart(e, 'move'); }}
      title={`${task.title}\n${sd} ~ ${dd}`}
    >
      <span className="text-[11px] text-white font-medium truncate flex-1 pointer-events-none">
        {task.title}
      </span>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100
                   flex items-center justify-center rounded-r-md"
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onDragStart(e, 'resize-right'); }}
        title="드래그하여 종료일 조정"
      >
        <div className="w-0.5 h-3 bg-white/70 rounded" />
        <div className="w-0.5 h-3 bg-white/70 rounded ml-0.5" />
      </div>
    </div>
  );
}

// ── DependencyArrows (SVG overlay) ────────────────────────────────
interface DependencyArrowsProps {
  tasks:        Task[];
  taskIndexMap: Map<string, number>;
  ganttStart:   string;
  previewMap:   Map<string, BarPreview>;
}

function DependencyArrows({ tasks, taskIndexMap, ganttStart, previewMap }: DependencyArrowsProps) {
  const arrows: React.ReactNode[] = [];

  for (const task of tasks) {
    if (!task.blockedBy.length) continue;
    const toIdx = taskIndexMap.get(task.id);
    if (toIdx === undefined) continue;

    const toSD  = previewMap.get(task.id)?.startDate ?? task.startDate;
    if (!toSD) continue;

    const toX = daysBetween(ganttStart, toSD) * CELL_W + 4;   // left edge of bar
    const toY = toIdx * ROW_H + ROW_H / 2;

    for (const blockerId of task.blockedBy) {
      const fromIdx  = taskIndexMap.get(blockerId);
      const blocker  = tasks.find((t) => t.id === blockerId);
      if (fromIdx === undefined || !blocker) continue;

      const fromDD = previewMap.get(blockerId)?.dueDate ?? blocker.dueDate;
      if (!fromDD) continue;

      const fromX = (daysBetween(ganttStart, fromDD) + 1) * CELL_W - 4;  // right edge of bar
      const fromY = fromIdx * ROW_H + ROW_H / 2;

      // Cubic bezier with horizontal control points
      const cpOffset = Math.max(20, Math.abs(toX - fromX) * 0.4);
      const d = `M ${fromX} ${fromY} C ${fromX + cpOffset} ${fromY}, ${toX - cpOffset} ${toY}, ${toX} ${toY}`;

      arrows.push(
        <g key={`${blockerId}→${task.id}`}>
          <path
            d={d}
            fill="none"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            markerEnd="url(#dep-arrow)"
            opacity="0.7"
          />
        </g>,
      );
    }
  }

  const totalH = tasks.length * ROW_H;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: totalH, overflow: 'visible', zIndex: 20 }}
    >
      <defs>
        <marker id="dep-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#f97316" opacity="0.85" />
        </marker>
      </defs>
      {arrows}
    </svg>
  );
}

// ── GanttPage ─────────────────────────────────────────────────────
export function GanttPage() {
  const allProjects = useAppStore((s) => s.projects);
  const allTasks    = useAppStore((s) => s.tasks);
  const users       = useAppStore((s) => s.users);
  const updateTask  = useAppStore((s) => s.updateTask);

  const projectList = Object.values(allProjects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const [selectedProjectId, setSelectedProjectId] = useState(projectList[0]?.id ?? 'p1');
  const [startDate, setStartDate]                 = useState(() => addDays(TODAY, -14));
  const VISIBLE_DAYS = 70; // 10 weeks

  const project = allProjects[selectedProjectId];
  const tasks   = Object.values(allTasks)
    .filter((t) => t.projectId === selectedProjectId)
    .sort((a, b) => a.order - b.order);

  // Drag state
  const [dragState,  setDragState]  = useState<DragState | null>(null);
  const [previewMap, setPreviewMap] = useState<Map<string, BarPreview>>(new Map());

  // Scroll sync refs
  const leftBodyRef  = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);
  const syncingRef   = useRef(false);

  const days        = Array.from({ length: VISIBLE_DAYS }, (_, i) => addDays(startDate, i));
  const todayOffset = daysBetween(startDate, TODAY);
  const taskIndexMap = new Map(tasks.map((t, i) => [t.id, i]));

  function prev() { setStartDate(addDays(startDate, -14)); }
  function next() { setStartDate(addDays(startDate,  14)); }

  function goToday() {
    setStartDate(addDays(TODAY, -14));
  }

  // ── drag handlers ─────────────────────────────────────────────
  function startDrag(e: React.MouseEvent, task: Task, type: DragType) {
    if (!task.startDate || !task.dueDate) return;
    setDragState({
      taskId:        task.id,
      type,
      startX:        e.clientX,
      origStartDate: task.startDate,
      origDueDate:   task.dueDate,
    });
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const dx        = e.clientX - dragState.startX;
    const deltaDays = Math.round(dx / CELL_W);
    if (deltaDays === 0) return;

    let newStart = dragState.origStartDate;
    let newDue   = dragState.origDueDate;

    if (dragState.type === 'move') {
      newStart = addDays(dragState.origStartDate, deltaDays);
      newDue   = addDays(dragState.origDueDate,   deltaDays);
    } else {
      // resize-right: only extend/shrink dueDate
      newDue = addDays(dragState.origDueDate, deltaDays);
      if (newDue < newStart) newDue = newStart;  // min 1 day span
    }

    setPreviewMap(new Map([[dragState.taskId, { startDate: newStart, dueDate: newDue }]]));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;
    const preview = previewMap.get(dragState.taskId);
    if (preview) {
      updateTask(dragState.taskId, {
        startDate: preview.startDate,
        dueDate:   preview.dueDate,
      });
    }
    setDragState(null);
    setPreviewMap(new Map());
  }, [dragState, previewMap, updateTask]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  // ── scroll sync ───────────────────────────────────────────────
  function onRightScroll(e: React.UIEvent<HTMLDivElement>) {
    if (syncingRef.current) return;
    if (!leftBodyRef.current) return;
    syncingRef.current = true;
    leftBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    syncingRef.current = false;
  }

  function onLeftScroll(e: React.UIEvent<HTMLDivElement>) {
    if (syncingRef.current) return;
    if (!rightBodyRef.current) return;
    syncingRef.current = true;
    rightBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    syncingRef.current = false;
  }

  // ── render ────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ cursor: dragState ? 'grabbing' : undefined, userSelect: dragState ? 'none' : undefined }}
    >
      <Header
        title="간트차트"
        subtitle={project?.name ?? '프로젝트 선택'}
        actions={
          <div className="flex items-center gap-2">
            {/* project selector */}
            <select
              className="input text-xs w-48"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* today button */}
            <button
              className="btn-secondary text-xs"
              onClick={goToday}
            >
              오늘
            </button>

            {/* date navigation */}
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button className="px-2 py-2 hover:bg-slate-50 transition-colors" onClick={prev}>
                <ChevronLeft size={14} className="text-slate-600" />
              </button>
              <span className="px-2 py-1.5 text-xs text-slate-600 font-medium select-none min-w-[72px] text-center">
                {startDate.slice(0, 4) + '년 ' + startDate.slice(5, 7) + '월'}
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

      {/* Main two-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          {/* Column header — same height as day-header */}
          <div className="h-16 shrink-0 border-b border-slate-100 px-4 flex items-end pb-2">
            <span className="text-xs font-semibold text-slate-500">
              업무명
              <span className="ml-1 text-slate-400 font-normal">({tasks.length})</span>
            </span>
          </div>

          {/* Task rows — overflow hidden, scroll synced with right panel */}
          <div
            ref={leftBodyRef}
            className="flex-1 overflow-y-hidden"
            onScroll={onLeftScroll}
          >
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-slate-400">
                등록된 업무가 없습니다.
              </div>
            ) : (
              tasks.map((task) => {
                const status    = project?.workflow.find((w) => w.id === task.statusId);
                const assignees = task.assigneeIds.map((id) => users[id]).filter(Boolean);
                const isBlocked = task.blockedBy.length > 0;
                const hasDate   = !!task.startDate && !!task.dueDate;
                return (
                  <div
                    key={task.id}
                    className="h-12 border-b border-slate-50 px-4 flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {isBlocked && (
                          <AlertTriangle size={10} className="text-orange-400 flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {status && (
                          <span
                            className="badge"
                            style={{ backgroundColor: `${status.color}20`, color: status.color }}
                          >
                            {status.label}
                          </span>
                        )}
                        {!hasDate && (
                          <span className="text-[10px] text-slate-400">날짜 미설정</span>
                        )}
                      </div>
                    </div>
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {assignees.slice(0, 2).map((u) => (
                        <Avatar key={u.id} name={u.name} size="xs" />
                      ))}
                      {assignees.length > 2 && (
                        <div className="w-5 h-5 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] text-slate-500 font-medium">
                          +{assignees.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: date header + bars ───────────────── */}
        <div
          ref={rightBodyRef}
          className="flex-1 overflow-auto"
          onScroll={onRightScroll}
        >
          <div style={{ minWidth: VISIBLE_DAYS * CELL_W }}>

            {/* Day headers — sticky */}
            <div className="h-16 flex sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
              {days.map((d, i) => {
                const date    = new Date(d + 'T00:00:00');
                const isToday = d === TODAY;
                const isSun   = date.getDay() === 0;
                const isSat   = date.getDay() === 6;
                const isFirst = date.getDate() === 1 || i === 0;
                return (
                  <div
                    key={d}
                    className={cn(
                      'flex-shrink-0 flex flex-col items-center justify-end pb-1 border-r border-slate-100 relative',
                      isToday && 'bg-primary-50',
                      (isSun || isSat) && !isToday && 'bg-slate-50/60',
                    )}
                    style={{ width: CELL_W }}
                  >
                    {isFirst && (
                      <span className="absolute top-2 left-1.5 text-[10px] font-bold text-slate-400">
                        {d.slice(5, 7)}월
                      </span>
                    )}
                    <span className={cn(
                      'text-[11px] leading-none',
                      isToday  ? 'text-primary-600 font-bold'
                      : isSun  ? 'text-red-400'
                      : isSat  ? 'text-blue-400'
                      : 'text-slate-400',
                    )}>
                      {date.getDate()}
                    </span>
                    <span className={cn(
                      'text-[10px] leading-none mt-0.5',
                      isToday  ? 'text-primary-500'
                      : isSun  ? 'text-red-300'
                      : isSat  ? 'text-blue-300'
                      : 'text-slate-300',
                    )}>
                      {WEEK_DAYS[date.getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bar rows + overlays */}
            <div className="relative" style={{ height: tasks.length * ROW_H }}>

              {/* Weekend columns background */}
              {days.map((d, i) => {
                const day = new Date(d + 'T00:00:00').getDay();
                if (day !== 0 && day !== 6) return null;
                return (
                  <div
                    key={d}
                    className="absolute top-0 bottom-0 bg-slate-50/70"
                    style={{ left: i * CELL_W, width: CELL_W }}
                  />
                );
              })}

              {/* Task bar rows */}
              {tasks.map((task, idx) => {
                const statusColor = project?.workflow.find((w) => w.id === task.statusId)?.color ?? '#94a3b8';
                const preview     = previewMap.get(task.id);
                const isDragging  = dragState?.taskId === task.id;
                return (
                  <div
                    key={task.id}
                    className="absolute left-0 right-0 border-b border-slate-50/80"
                    style={{ top: idx * ROW_H, height: ROW_H }}
                  >
                    <GanttBar
                      task={task}
                      ganttStart={startDate}
                      preview={preview}
                      color={statusColor}
                      isDragging={isDragging}
                      onDragStart={(e, type) => startDrag(e, task, type)}
                    />
                  </div>
                );
              })}

              {/* Dependency arrows SVG */}
              <DependencyArrows
                tasks={tasks}
                taskIndexMap={taskIndexMap}
                ganttStart={startDate}
                previewMap={previewMap}
              />

              {/* Today vertical line */}
              {todayOffset >= 0 && todayOffset < VISIBLE_DAYS && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-30"
                  style={{ left: todayOffset * CELL_W + CELL_W / 2 }}
                >
                  <div className="w-px h-full bg-red-400/50" />
                  {/* Today badge at top */}
                  <div
                    className="absolute -top-0 -translate-x-1/2 bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold shadow-sm whitespace-nowrap"
                    style={{ top: 0 }}
                  >
                    오늘
                  </div>
                </div>
              )}
            </div>

            {/* Empty state */}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                이 프로젝트에 업무가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div className="px-6 py-2.5 border-t border-slate-100 bg-white flex items-center gap-5 flex-wrap">
        {project?.workflow.map((w) => (
          <div key={w.id} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: w.color }} />
            {w.label}
          </div>
        ))}
        <div className="ml-2 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-px h-3.5 bg-red-400" />
          오늘
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg width="20" height="10">
            <line x1="0" y1="5" x2="16" y2="5" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="14,2 14,8 20,5" fill="#f97316" />
          </svg>
          선후행 관계
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <AlertTriangle size={11} className="text-orange-400" />
          선행 업무 있음
        </div>
        <p className="text-xs text-slate-400">
          바를 드래그하여 일정을 조정하거나, 우측 핸들로 기간을 조정하세요.
        </p>
      </div>
    </div>
  );
}
