import { useState, useCallback } from 'react';
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
  Plus, MoreHorizontal, GripVertical, Link2, Pencil, Trash2, Settings2,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/Modal';
import { TaskModal } from '../../components/tasks/TaskModal';
import { ProjectModal } from '../../components/projects/ProjectModal';
import { useAppStore } from '../../store/useAppStore';
import { formatDate, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { Task, WorkflowStatus } from '../../types';

// ── TaskCard (sortable) ────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  projectId: string;
  overlay?: boolean;
}

function TaskCard({ task, projectId, overlay = false }: TaskCardProps) {
  const { project, users, deleteTask } = useAppStore((s) => ({
    project:    s.projects[projectId],
    users:      s.users,
    deleteTask: s.deleteTask,
  }));

  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const assignees = task.assigneeIds
    .map((id) => users[id])
    .filter(Boolean);

  const tags = task.tagIds
    .map((id) => project?.tags.find((t) => t.id === id))
    .filter(Boolean);

  const hasBlocker = task.blockedBy.length > 0;

  return (
    <>
      <div
        ref={setNodeRef}
        style={!overlay ? style : undefined}
        className={cn(
          'bg-white rounded-xl border border-slate-200 p-3.5 group',
          overlay ? 'shadow-modal rotate-1 cursor-grabbing' : 'shadow-card hover:shadow-md cursor-grab active:cursor-grabbing',
          isDragging && 'border-primary-200',
        )}
      >
        {/* Header: tags + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {tags.map((tag) => (
              <TagBadge key={tag!.id} name={tag!.name} color={tag!.color} />
            ))}
            {hasBlocker && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">
                <Link2 size={9} /> 선행 {task.blockedBy.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              {...attributes}
              {...listeners}
              className="p-1 rounded text-slate-300 cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={13} />
            </button>
            <div className="relative">
              <button
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreHorizontal size={13} />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-modal z-50 py-1"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50"
                    onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                  >
                    <Pencil size={12} className="text-slate-400" /> 수정
                  </button>
                  <button
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-red-600"
                    onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                  >
                    <Trash2 size={12} /> 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-slate-800 leading-snug mb-2">{task.title}</p>

        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className={cn('badge', PRIORITY_COLOR[task.priority])}>
            {PRIORITY_LABEL[task.priority]}
          </span>

          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={cn(
                'text-[11px]',
                task.dueDate < '2026-04-13' ? 'text-red-500 font-semibold' : 'text-slate-400',
              )}>
                {formatDate(task.dueDate, 'MM/dd')}
              </span>
            )}
            <div className="flex -space-x-1">
              {assignees.slice(0, 2).map((u) => (
                <Avatar key={u.id} name={u.name} size="xs" />
              ))}
              {assignees.length > 2 && (
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                  +{assignees.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        projectId={projectId}
        task={task}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="업무 삭제"
        description={`"${task.title}" 업무를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={() => { deleteTask(task.id); setDeleteOpen(false); }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  projectId,
}: {
  status: WorkflowStatus;
  tasks: Task[];
  projectId: string;
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <h3 className="text-xs font-bold text-slate-700">{status.label}</h3>
          <span
            className="badge text-xs"
            style={{ backgroundColor: `${status.color}20`, color: status.color }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Cards */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[120px] pr-0.5">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} projectId={projectId} />
          ))}

          <button
            className="w-full text-left px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50 transition-all flex items-center gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={12} /> 업무 추가
          </button>
        </div>
      </SortableContext>

      <TaskModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        projectId={projectId}
        defaultStatusId={status.id}
      />
    </div>
  );
}

// ── KanbanPage ─────────────────────────────────────────────────
export function KanbanPage() {
  const { projects, tasks: allTasks, moveTask, reorderTask } = useAppStore((s) => ({
    projects:    s.projects,
    tasks:       s.tasks,
    moveTask:    s.moveTask,
    reorderTask: s.reorderTask,
  }));

  const [selectedProjectId, setSelectedProjectId] = useState(
    Object.keys(projects)[0] ?? '',
  );
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const project = projects[selectedProjectId];
  const projectTasks = Object.values(allTasks)
    .filter((t) => t.projectId === selectedProjectId)
    .sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

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
    const activeId  = active.id as string;
    const overId    = over.id   as string;
    const activeTask = allTasks[activeId];
    if (!activeTask) return;

    // If dragging over a column id (status.id), change status
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
    const activeTask = allTasks[activeId];
    const overTask   = allTasks[overId];

    if (!activeTask || !overTask) return;
    if (activeTask.statusId !== overTask.statusId) return;

    const col       = projectTasks.filter((t) => t.statusId === activeTask.statusId).sort((a, b) => a.order - b.order);
    const fromIndex = col.findIndex((t) => t.id === activeId);
    const toIndex   = col.findIndex((t) => t.id === overId);
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      reorderTask(selectedProjectId, activeTask.statusId, fromIndex, toIndex);
    }
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        프로젝트가 없습니다.
      </div>
    );
  }

  const workflow = project.workflow.slice().sort((a, b) => a.order - b.order);

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
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {Object.values(projects).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn-secondary py-1.5"
              onClick={() => setEditProjectOpen(true)}
              title="워크플로우 설정"
            >
              <Settings2 size={14} />
            </button>
          </div>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 h-full p-6 min-w-max">
            {workflow.map((status) => (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={tasksByStatus(status.id)}
                projectId={selectedProjectId}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} projectId={selectedProjectId} overlay />
          )}
        </DragOverlay>
      </DndContext>

      <ProjectModal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={project}
      />
    </div>
  );
}
