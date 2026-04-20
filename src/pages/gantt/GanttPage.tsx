import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle } from 'lucide-react';
import { Header }  from '../../components/layout/Header';
import { Avatar }  from '../../components/ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useUIStore }  from '../../store/useUIStore';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

// ── constants ─────────────────────────────────────────────────────
const TODAY         = new Date().toISOString().slice(0, 10);
const WEEK_DAYS     = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_W        = 36;
const ROW_H         = 48;
const CANVAS_BEFORE = 180;
const CANVAS_AFTER  = 365;
const CANVAS_DAYS   = CANVAS_BEFORE + CANVAS_AFTER;

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

  return (
    <div
      data-gantt-bar="true"
      className={cn(
        'absolute top-1/2 -tranzinc-y-1/2 h-6 rounded-md flex items-center px-2 select-none group',
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

    const toX = daysBetween(ganttStart, toSD) * CELL_W + 4;
    const toY = toIdx * ROW_H + ROW_H / 2;

    for (const blockerId of task.blockedBy) {
      const fromIdx  = taskIndexMap.get(blockerId);
      const blocker  = tasks.find((t) => t.id === blockerId);
      if (fromIdx === undefined || !blocker) continue;

      const fromDD = previewMap.get(blockerId)?.dueDate ?? blocker.dueDate;
      if (!fromDD) continue;

      const fromX = (daysBetween(ganttStart, fromDD) + 1) * CELL_W - 4;
      const fromY = fromIdx * ROW_H + ROW_H / 2;

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
  const isDark             = useUIStore(s => s.isDark);
  const allProjects        = useAppStore((s) => s.projects);
  const allTasks           = useAppStore((s) => s.tasks);
  const users              = useAppStore((s) => s.users);
  const updateTask         = useAppStore((s) => s.updateTask);
  const globalProjectId    = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  const projectList = Object.values(allProjects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const [selectedProjectId, setSelectedProjectId] = useState(
    globalProjectId ?? projectList[0]?.id ?? '',
  );

  useEffect(() => {
    if (globalProjectId && globalProjectId !== selectedProjectId) {
      setSelectedProjectId(globalProjectId);
    }
  }, [globalProjectId]);

  const ganttAnchor = useRef(addDays(TODAY, -CANVAS_BEFORE)).current;
  const [visibleDate, setVisibleDate] = useState(() => addDays(TODAY, -14));

  const project = allProjects[selectedProjectId];
  const tasks   = Object.values(allTasks)
    .filter((t) => t.projectId === selectedProjectId)
    .sort((a, b) => a.order - b.order);

  const [dragState,  setDragState]  = useState<DragState | null>(null);
  const [previewMap, setPreviewMap] = useState<Map<string, BarPreview>>(new Map());

  const panRef    = useRef<{ startX: number; scrollLeft: number } | null>(null);
  const isPanning = useRef(false);
  const [panning, setPanning] = useState(false);

  const leftBodyRef  = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);
  const syncingRef   = useRef(false);

  const days         = Array.from({ length: CANVAS_DAYS }, (_, i) => addDays(ganttAnchor, i));
  const todayOffset  = daysBetween(ganttAnchor, TODAY);
  const taskIndexMap = new Map(tasks.map((t, i) => [t.id, i]));

  useEffect(() => {
    if (rightBodyRef.current) {
      rightBodyRef.current.scrollLeft = (todayOffset - 14) * CELL_W;
    }
  }, []);

  function scrollBy(days: number) {
    if (rightBodyRef.current) {
      rightBodyRef.current.scrollLeft += days * CELL_W;
    }
  }

  function prev()    { scrollBy(-30); }
  function next()    { scrollBy(30); }
  function goToday() {
    if (rightBodyRef.current) {
      rightBodyRef.current.scrollLeft = (todayOffset - 14) * CELL_W;
    }
  }

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
      newDue = addDays(dragState.origDueDate, deltaDays);
      if (newDue < newStart) newDue = newStart;
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

  function onChartMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (dragState) return;
    if ((e.target as HTMLElement).closest('[data-gantt-bar]')) return;
    if (!rightBodyRef.current) return;
    e.preventDefault();
    isPanning.current = true;
    setPanning(true);
    panRef.current = { startX: e.clientX, scrollLeft: rightBodyRef.current.scrollLeft };
  }

  useEffect(() => {
    if (!panning) return;

    function onPanMove(e: MouseEvent) {
      if (!isPanning.current || !panRef.current || !rightBodyRef.current) return;
      const dx = e.clientX - panRef.current.startX;
      rightBodyRef.current.scrollLeft = panRef.current.scrollLeft - dx;
    }

    function onPanUp() {
      isPanning.current = false;
      panRef.current = null;
      setPanning(false);
    }

    window.addEventListener('mousemove', onPanMove);
    window.addEventListener('mouseup',   onPanUp);
    return () => {
      window.removeEventListener('mousemove', onPanMove);
      window.removeEventListener('mouseup',   onPanUp);
    };
  }, [panning]);

  function onRightScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (!syncingRef.current && leftBodyRef.current) {
      syncingRef.current = true;
      leftBodyRef.current.scrollTop = el.scrollTop;
      syncingRef.current = false;
    }
    const scrolledDays = Math.floor(el.scrollLeft / CELL_W);
    setVisibleDate(addDays(ganttAnchor, scrolledDays));
  }

  function onLeftScroll(e: React.UIEvent<HTMLDivElement>) {
    if (syncingRef.current) return;
    if (!rightBodyRef.current) return;
    syncingRef.current = true;
    rightBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    syncingRef.current = false;
  }

  const gridBorder  = isDark ? '#3f3f46' : '#f4f4f5';
  const weekendBg   = isDark ? 'rgba(39,39,42,0.6)' : 'rgba(250,250,250,0.7)';
  const todayBg     = isDark ? '#27272a' : '#f4f4f5';

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
            <select
              className="input text-xs w-48"
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedProject(e.target.value); }}
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button className="btn-secondary text-xs" onClick={goToday}>오늘</button>

            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
              <button className="px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" onClick={prev}>
                <ChevronLeft size={14} className="text-zinc-600 dark:text-zinc-300" />
              </button>
              <span className="px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium select-none min-w-[72px] text-center">
                {visibleDate.slice(0, 4) + '년 ' + visibleDate.slice(5, 7) + '월'}
              </span>
              <button className="px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors" onClick={next}>
                <ChevronRight size={14} className="text-zinc-600 dark:text-zinc-300" />
              </button>
            </div>

            <button className="btn-primary">
              <Plus size={14} /> 업무 추가
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="h-16 shrink-0 border-b border-zinc-100 dark:border-zinc-700 px-4 flex items-end pb-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              업무명
              <span className="ml-1 text-zinc-400 dark:text-zinc-500 font-normal">({tasks.length})</span>
            </span>
          </div>

          <div ref={leftBodyRef} className="flex-1 overflow-y-hidden" onScroll={onLeftScroll}>
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-zinc-400 dark:text-zinc-500">
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
                    className="h-12 border-b border-zinc-50 dark:border-zinc-800 px-4 flex items-center gap-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {isBlocked && (
                          <AlertTriangle size={10} className="text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{task.title}</p>
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
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">날짜 미설정</span>
                        )}
                      </div>
                    </div>
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {assignees.slice(0, 2).map((u) => (
                        <Avatar key={u.id} name={u.name} size="xs" />
                      ))}
                      {assignees.length > 2 && (
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-600 border border-white dark:border-zinc-800 flex items-center justify-center text-[9px] text-zinc-500 dark:text-zinc-300 font-medium">
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
          onMouseDown={onChartMouseDown}
          style={{ cursor: dragState || panning ? 'grabbing' : 'grab' }}
        >
          <div style={{ minWidth: CANVAS_DAYS * CELL_W }}>

            {/* Day headers — sticky */}
            <div className="h-16 flex sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-100 dark:border-zinc-700 shadow-sm">
              {days.map((d, i) => {
                const date    = new Date(d + 'T00:00:00');
                const isToday = d === TODAY;
                const isSun   = date.getDay() === 0;
                const isSat   = date.getDay() === 6;
                const isFirst = date.getDate() === 1 || i === 0;
                return (
                  <div
                    key={d}
                    className="flex-shrink-0 flex flex-col items-center justify-end pb-1 relative"
                    style={{
                      width: CELL_W,
                      borderRight: `1px solid ${gridBorder}`,
                      backgroundColor: isToday ? todayBg : (isSun || isSat) ? weekendBg : undefined,
                    }}
                  >
                    {isFirst && (
                      <span className="absolute top-2 left-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                        {d.slice(5, 7)}월
                      </span>
                    )}
                    <span className={cn(
                      'text-[11px] leading-none',
                      isToday  ? 'text-zinc-900 dark:text-zinc-50 font-bold'
                      : isSun  ? 'text-red-400'
                      : isSat  ? 'text-zinc-400 dark:text-zinc-500'
                      : 'text-zinc-400 dark:text-zinc-500',
                    )}>
                      {date.getDate()}
                    </span>
                    <span className={cn(
                      'text-[10px] leading-none mt-0.5',
                      isToday  ? 'text-zinc-700 dark:text-zinc-300'
                      : isSun  ? 'text-red-300'
                      : isSat  ? 'text-zinc-300 dark:text-zinc-600'
                      : 'text-zinc-300 dark:text-zinc-600',
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
                    className="absolute top-0 bottom-0"
                    style={{ left: i * CELL_W, width: CELL_W, backgroundColor: weekendBg }}
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
                    className="absolute left-0 right-0"
                    style={{ top: idx * ROW_H, height: ROW_H, borderBottom: `1px solid ${gridBorder}` }}
                  >
                    <GanttBar
                      task={task}
                      ganttStart={ganttAnchor}
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
                ganttStart={ganttAnchor}
                previewMap={previewMap}
              />

              {/* Today vertical line */}
              {todayOffset >= 0 && todayOffset < CANVAS_DAYS && (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-30"
                  style={{ left: todayOffset * CELL_W + CELL_W / 2 }}
                >
                  <div className="w-px h-full bg-red-400/50" />
                  <div
                    className="absolute -top-0 -tranzinc-x-1/2 bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold shadow-sm whitespace-nowrap"
                    style={{ top: 0 }}
                  >
                    오늘
                  </div>
                </div>
              )}
            </div>

            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-zinc-400 dark:text-zinc-500">
                이 프로젝트에 업무가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────────────── */}
      <div className="px-6 py-2.5 border-t border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center gap-5 flex-wrap">
        {project?.workflow.map((w) => (
          <div key={w.id} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: w.color }} />
            {w.label}
          </div>
        ))}
        <div className="ml-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="w-px h-3.5 bg-red-400" />
          오늘
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <svg width="20" height="10">
            <line x1="0" y1="5" x2="16" y2="5" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2" />
            <polygon points="14,2 14,8 20,5" fill="#f97316" />
          </svg>
          선후행 관계
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
          <AlertTriangle size={11} className="text-zinc-400 dark:text-zinc-500" />
          선행 업무 있음
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          바를 드래그하여 일정을 조정하거나, 우측 핸들로 기간을 조정하세요.
        </p>
      </div>
    </div>
  );
}
