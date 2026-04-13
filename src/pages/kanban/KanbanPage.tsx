import { useState } from 'react';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { TagBadge } from '../../components/ui/Badge';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../data/mock';
import { formatDate, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '../../lib/utils';
import type { Task, TaskStatus } from '../../types';

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'todo',        label: '진행 전', color: 'text-slate-600', bg: 'bg-slate-100' },
  { id: 'in_progress', label: '진행 중', color: 'text-blue-700',  bg: 'bg-blue-50' },
  { id: 'review',      label: '검토 중', color: 'text-amber-700', bg: 'bg-amber-50' },
  { id: 'done',        label: '완료',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
];

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group">
      {/* Drag handle + menu */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={12} className="text-slate-300" />
          <button className="p-0.5 rounded text-slate-400 hover:text-slate-600">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-slate-800 leading-snug mb-2">{task.title}</p>

      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
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
          {task.assignees.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 2).map((u) => (
                <Avatar key={u.id} name={u.name} size="xs" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanPage() {
  const [selectedProject, setSelectedProject] = useState('p1');

  const tasks = MOCK_TASKS.filter((t) => t.projectId === selectedProject);
  const project = MOCK_PROJECTS.find((p) => p.id === selectedProject);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="칸반 보드"
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
            <button className="btn-primary">
              <Plus size={14} /> 업무 추가
            </button>
          </div>
        }
      />

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-6 min-w-max">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col w-72 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('text-xs font-bold', col.color)}>{col.label}</h3>
                    <span className={cn('badge text-xs', col.bg, col.color)}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                    <Plus size={14} />
                  </button>
                </div>

                {/* Drop zone */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px]">
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}

                  {/* Add card button */}
                  <button className="w-full text-left px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50 transition-all flex items-center gap-2">
                    <Plus size={12} />
                    업무 추가
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
