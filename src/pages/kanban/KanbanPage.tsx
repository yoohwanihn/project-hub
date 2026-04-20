import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, MoreHorizontal, GripVertical, Link2, Pencil, Trash2,
  Settings2, LayoutList, Columns3, Users,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { TaskModal } from '../../components/tasks/TaskModal';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { useAppStore } from '../../store/useAppStore';
import { formatDate, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { Task, WorkflowStatus, User } from '../../types';

// ── TaskCard ───────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  projectId: string;
  overlay?: boolean;
}

function TaskCard({ task, projectId, overlay = false }: TaskCardProps) {
  const project    = useAppStore(s => s.projects[projectId]);
  const users      = useAppStore(s => s.users);
  const deleteTask = useAppStore(s => s.deleteTask);

  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  const assignees  = task.assigneeIds.map((id) => users[id]).filter(Boolean);
  const tags       = task.tagIds.map((id) => project?.tags.find((t) => t.id === id)).filter(Boolean);
  const hasBlocker = task.blockedBy.length > 0;

  const progress = task.estimatedHours && task.estimatedHours > 0
    ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
    : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={!overlay ? style : undefined}
        className={cn(
          'bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-3.5 group',
          overlay ? 'shadow-modal rotate-1 cursor-grabbing' : 'shadow-card hover:shadow-md cursor-grab active:cursor-grabbing',
          isDragging && 'border-zinc-200 dark:border-zinc-700',
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {tags.map((tag) => <TagBadge key={tag!.id} name={tag!.name} color={tag!.color} />)}
            {hasBlocker && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                <Link2 size={9} /> {task.blockedBy.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button {...attributes} {...listeners} className="p-1 rounded text-zinc-300 dark:text-zinc-600 cursor-grab" onClick={(e) => e.stopPropagation()}>
              <GripVertical size={13} />
            </button>
            <div className="relative">
              <button className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700" onClick={() => setMenuOpen((o) => !o)}>
                <MoreHorizontal size={13} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-modal z-50 py-1" onMouseLeave={() => setMenuOpen(false)}>
                  <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:text-zinc-200" onClick={() => { setMenuOpen(false); setEditOpen(true); }}>
                    <Pencil size={12} className="text-zinc-400" /> 수정
                  </button>
                  <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600" onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}>
                    <Trash2 size={12} /> 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-snug mb-2">{task.title}</p>

        {task.description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mb-3">{task.description}</p>
        )}

        {progress !== null && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">진행 {progress}%</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{task.loggedHours}h / {task.estimatedHours}h</span>
            </div>
            <div className="h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-zinc-900 dark:bg-white' : progress >= 60 ? 'bg-zinc-600 dark:bg-zinc-300' : 'bg-zinc-300 dark:bg-zinc-500')}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={cn('badge', PRIORITY_COLOR[task.priority])}>{PRIORITY_LABEL[task.priority]}</span>
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={cn('text-[11px]', task.dueDate < '2026-04-13' ? 'text-red-500 font-semibold' : 'text-zinc-400 dark:text-zinc-500')}>
                {formatDate(task.dueDate, 'MM/dd')}
              </span>
            )}
            <div className="flex -space-x-1">
              {assignees.slice(0, 2).map((u) => <Avatar key={u.id} name={u.name} size="xs" />)}
              {assignees.length > 2 && (
                <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white dark:ring-zinc-800">
                  +{assignees.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal open={editOpen} onClose={() => setEditOpen(false)} projectId={projectId} task={task} />
      <ConfirmDialog
        open={deleteOpen}
        title="업무 삭제"
        description={`"${task.title}" 업무를 삭제합니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제" danger
        onConfirm={() => { deleteTask(task.id); setDeleteOpen(false); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}

// ── WorkloadBar (담당자 업무 로드) ────────────────────────────
function WorkloadPanel({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const project = useAppStore((s) => s.projects[projectId]);

  const members = project?.members ?? [];
  const maxLoad = Math.max(1, ...members.map((m) => tasks.filter((t) => t.assigneeIds.includes(m.id) && t.statusId !== 'done').length));

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-6 py-3">
      <div className="flex items-center gap-1 mb-2">
        <Users size={12} className="text-zinc-400 dark:text-zinc-500" />
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">담당자 업무 로드</span>
      </div>
      <div className="flex items-end gap-4 overflow-x-auto pb-1">
        {members.map((member) => {
          const active = tasks.filter((t) => t.assigneeIds.includes(member.id) && t.statusId !== 'done');
          const done   = tasks.filter((t) => t.assigneeIds.includes(member.id) && t.statusId === 'done');
          const pct    = Math.round((active.length / maxLoad) * 100);
          const isOver = active.length >= 5;

          return (
            <div key={member.id} className="flex flex-col items-center gap-1.5 min-w-[52px]">
              <div className="flex items-end h-12 gap-0.5">
                <div className="w-4 flex flex-col justify-end h-full">
                  <div
                    className={cn('w-full rounded-t-sm transition-all', isOver ? 'bg-red-400' : 'bg-zinc-700 dark:bg-zinc-300')}
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <div className="w-4 flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t-sm bg-zinc-600 dark:bg-zinc-500"
                    style={{ height: `${Math.max(0, Math.round((done.length / Math.max(1, active.length + done.length)) * 48))}%` }}
                  />
                </div>
              </div>
              <Avatar name={member.name} size="xs" />
              <div className="text-center">
                <p className={cn('text-[11px] font-bold', isOver ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300')}>{active.length}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[48px]">{member.name.split('').slice(0, 3).join('')}</p>
              </div>
            </div>
          );
        })}

        <div className="ml-2 flex flex-col gap-1.5 self-center">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-700 dark:bg-zinc-300" /> 진행 중
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 dark:bg-zinc-500" /> 완료
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-red-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> 과부하(5+)
          </div>
        </div>
      </div>
    </div>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────
function KanbanColumn({ status, tasks, projectId }: { status: WorkflowStatus; tasks: Task[]; projectId: string }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{status.label}</h3>
          <span className="badge text-xs" style={{ backgroundColor: `${status.color}20`, color: status.color }}>
            {tasks.length}
          </span>
        </div>
        <button className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[120px] pr-0.5">
          {tasks.map((task) => <TaskCard key={task.id} task={task} projectId={projectId} />)}
          <button
            className="w-full text-left px-3 py-2.5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={12} /> 업무 추가
          </button>
        </div>
      </SortableContext>

      <TaskModal open={addOpen} onClose={() => setAddOpen(false)} projectId={projectId} defaultStatusId={status.id} />
    </div>
  );
}

// ── SwimlaneRow (담당자별 행) ──────────────────────────────────
function SwimlaneRow({
  member,
  workflow,
  tasks,
  projectId,
}: {
  member: User;
  workflow: WorkflowStatus[];
  tasks: Task[];
  projectId: string;
}) {
  const myTasks = tasks.filter((t) => t.assigneeIds.includes(member.id));

  return (
    <div className="flex min-w-max">
      <div className="w-40 shrink-0 flex items-start gap-2.5 pt-2 px-3 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
        <Avatar name={member.name} size="sm" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">{member.name}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{myTasks.length}개 업무</p>
        </div>
      </div>

      <div className="flex gap-4 px-4 py-2">
        {workflow.map((status) => {
          const colTasks = myTasks.filter((t) => t.statusId === status.id);
          return (
            <div key={status.id} className="w-64 shrink-0">
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[60px]">
                  {colTasks.map((task) => <TaskCard key={task.id} task={task} projectId={projectId} />)}
                  {colTasks.length === 0 && (
                    <div className="h-12 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800" />
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KanbanPage ─────────────────────────────────────────────────
type ViewMode = 'board' | 'swimlane';

export function KanbanPage() {
  const projects    = useAppStore(s => s.projects);
  const allTasks    = useAppStore(s => s.tasks);
  const moveTask    = useAppStore(s => s.moveTask);
  const reorderTask = useAppStore(s => s.reorderTask);

  const globalProjectId    = useAppStore(s => s.selectedProjectId);
  const setSelectedProject = useAppStore(s => s.setSelectedProject);

  const [selectedProjectId, setSelectedProjectId] = useState(
    globalProjectId ?? Object.keys(projects)[0] ?? '',
  );

  useEffect(() => {
    if (globalProjectId && globalProjectId !== selectedProjectId) {
      setSelectedProjectId(globalProjectId);
    }
  }, [globalProjectId]);
  const [viewMode,           setViewMode]          = useState<ViewMode>('board');
  const [showWorkload,       setShowWorkload]       = useState(true);
  const [editProjectOpen,    setEditProjectOpen]    = useState(false);
  const [activeTask,         setActiveTask]         = useState<Task | null>(null);

  const project      = projects[selectedProjectId];
  const projectTasks = useMemo(
    () => Object.values(allTasks).filter((t) => t.projectId === selectedProjectId).sort((a, b) => a.order - b.order),
    [allTasks, selectedProjectId],
  );
  const workflow = useMemo(
    () => project?.workflow.slice().sort((a, b) => a.order - b.order) ?? [],
    [project],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const tasksByStatus = useCallback(
    (statusId: string) => projectTasks.filter((t) => t.statusId === statusId),
    [projectTasks],
  );

  function onDragStart({ active }: DragStartEvent) {
    const t = allTasks[active.id as string];
    if (t) setActiveTask(t);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId   = active.id as string;
    const overId     = over.id   as string;
    const activeTask = allTasks[activeId];
    if (!activeTask) return;

    const overTask   = allTasks[overId];
    const toStatusId = overTask ? overTask.statusId : overId;

    if (toStatusId && toStatusId !== activeTask.statusId) {
      const col = projectTasks.filter((t) => t.statusId === toStatusId);
      moveTask(activeId, toStatusId, col.length);
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;
    const activeId   = active.id as string;
    const overId     = over.id   as string;
    const taskA      = allTasks[activeId];
    const taskB      = allTasks[overId];
    if (!taskA || !taskB || taskA.statusId !== taskB.statusId) return;

    const col       = projectTasks.filter((t) => t.statusId === taskA.statusId).sort((a, b) => a.order - b.order);
    const fromIndex = col.findIndex((t) => t.id === activeId);
    const toIndex   = col.findIndex((t) => t.id === overId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderTask(selectedProjectId, taskA.statusId, fromIndex, toIndex);
    }
  }

  if (!project) {
    return <div className="flex items-center justify-center h-full text-zinc-400 text-sm">프로젝트가 없습니다.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="칸반 보드"
        subtitle={project.name}
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input text-xs w-48 py-1.5"
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedProject(e.target.value); }}
            >
              {Object.values(projects).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-800">
              <button
                className={cn('px-2.5 py-1.5 transition-colors', viewMode === 'board' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700')}
                onClick={() => setViewMode('board')}
                title="보드 뷰"
              >
                <Columns3 size={14} />
              </button>
              <button
                className={cn('px-2.5 py-1.5 transition-colors', viewMode === 'swimlane' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700')}
                onClick={() => setViewMode('swimlane')}
                title="수영레인 뷰"
              >
                <LayoutList size={14} />
              </button>
            </div>

            <button
              className={cn('btn-secondary py-1.5', showWorkload && 'bg-zinc-100 dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-50')}
              onClick={() => setShowWorkload((v) => !v)}
              title="업무 로드"
            >
              <Users size={14} />
            </button>

            <button className="btn-secondary py-1.5" onClick={() => setEditProjectOpen(true)} title="워크플로우 설정">
              <Settings2 size={14} />
            </button>
          </div>
        }
      />

      {showWorkload && <WorkloadPanel projectId={selectedProjectId} tasks={projectTasks} />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {viewMode === 'board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-4 h-full p-6 min-w-max">
              {workflow.map((status) => (
                <KanbanColumn key={status.id} status={status} tasks={tasksByStatus(status.id)} projectId={selectedProjectId} />
              ))}
            </div>
          </div>
        )}

        {viewMode === 'swimlane' && (
          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 z-20 flex min-w-max bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 shadow-sm">
              <div className="w-40 shrink-0 px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-700">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">담당자</span>
              </div>
              <div className="flex gap-4 px-4 py-2.5">
                {workflow.map((s) => (
                  <div key={s.id} className="w-64 shrink-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{s.label}</span>
                    <span className="badge text-[10px]" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                      {tasksByStatus(s.id).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {project.members.map((member) => (
                <SwimlaneRow
                  key={member.id}
                  member={member}
                  workflow={workflow}
                  tasks={projectTasks}
                  projectId={selectedProjectId}
                />
              ))}

              {(() => {
                const unassigned = projectTasks.filter((t) => t.assigneeIds.length === 0);
                if (unassigned.length === 0) return null;
                return (
                  <div className="flex min-w-max">
                    <div className="w-40 shrink-0 flex items-start gap-2.5 pt-2 px-3 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <Users size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">미배정</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{unassigned.length}개</p>
                      </div>
                    </div>
                    <div className="flex gap-4 px-4 py-2">
                      {workflow.map((status) => {
                        const colTasks = unassigned.filter((t) => t.statusId === status.id);
                        return (
                          <div key={status.id} className="w-64 shrink-0">
                            <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2 min-h-[60px]">
                                {colTasks.map((task) => <TaskCard key={task.id} task={task} projectId={selectedProjectId} />)}
                                {colTasks.length === 0 && <div className="h-12 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800" />}
                              </div>
                            </SortableContext>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} projectId={selectedProjectId} overlay />}
        </DragOverlay>
      </DndContext>

      <ProjectModal open={editProjectOpen} onClose={() => setEditProjectOpen(false)} project={project} />
    </div>
  );
}
