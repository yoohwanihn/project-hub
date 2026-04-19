import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, ChevronDown, ChevronRight,
  CalendarDays, Flag, Inbox,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import type { Task } from '../../types';

const TODAY = new Date().toISOString().slice(0, 10);

function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const WEEK_END = addDays(TODAY, 6);

type GroupKey = 'overdue' | 'today' | 'this_week' | 'later' | 'no_date';

const GROUP_META: Record<GroupKey, { label: string; color: string; icon: React.ReactNode }> = {
  overdue:   { label: '기한 초과',  color: 'text-red-600',    icon: <AlertTriangle size={14} className="text-red-500" /> },
  today:     { label: '오늘',       color: 'text-zinc-900',   icon: <Clock size={14} className="text-zinc-700" /> },
  this_week: { label: '이번 주',    color: 'text-zinc-900',icon: <CalendarDays size={14} className="text-zinc-700" /> },
  later:     { label: '나중에',     color: 'text-zinc-600',  icon: <Flag size={14} className="text-zinc-400" /> },
  no_date:   { label: '날짜 미설정',color: 'text-zinc-500',  icon: <Inbox size={14} className="text-zinc-400" /> },
};

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  urgent: { label: '긴급', color: 'bg-red-100 text-red-700' },
  high:   { label: '높음', color: 'bg-zinc-200 text-zinc-800' },
  medium: { label: '보통', color: 'bg-zinc-100 text-zinc-600' },
  low:    { label: '낮음', color: 'bg-zinc-100 text-zinc-600' },
};

function getGroup(task: Task): GroupKey {
  if (!task.dueDate) return 'no_date';
  if (task.dueDate < TODAY)    return 'overdue';
  if (task.dueDate === TODAY)  return 'today';
  if (task.dueDate <= WEEK_END) return 'this_week';
  return 'later';
}

interface TaskRowProps {
  task: Task;
  projectName: string;
  projectColor: string;
  statusLabel: string;
  statusColor: string;
  onDone: () => void;
}

function TaskRow({ task, projectName, projectColor, statusLabel, statusColor, onDone }: TaskRowProps) {
  const isDone = task.statusId.endsWith('-done') || task.statusId === 'done';
  const navigate = useNavigate();
  const setSelectedProject = useAppStore(s => s.setSelectedProject);

  function handleClick() {
    setSelectedProject(task.projectId);
    navigate(`/projects/${task.projectId}`);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 transition-colors group rounded-lg">
      {/* Done toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onDone(); }}
        className="flex-shrink-0 text-zinc-300 hover:text-zinc-700 transition-colors"
      >
        {isDone
          ? <CheckCircle2 size={16} className="text-green-500" />
          : <Circle size={16} />
        }
      </button>

      {/* Title + meta */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleClick}
      >
        <p className={cn('text-sm font-medium truncate', isDone && 'line-through text-zinc-400')}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {/* Project badge */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${projectColor}18`, color: projectColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projectColor }} />
            {projectName}
          </span>
          {/* Status */}
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${statusColor}18`, color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Priority */}
      {task.priority && PRIORITY_LABEL[task.priority] && (
        <span className={cn(
          'hidden sm:inline text-[11px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
          PRIORITY_LABEL[task.priority].color,
        )}>
          {PRIORITY_LABEL[task.priority].label}
        </span>
      )}

      {/* Due date */}
      {task.dueDate && (
        <span className={cn(
          'text-[11px] flex-shrink-0',
          task.dueDate < TODAY ? 'text-red-500 font-semibold'
          : task.dueDate === TODAY ? 'text-zinc-900 font-semibold'
          : 'text-zinc-400',
        )}>
          {task.dueDate.slice(5).replace('-', '/')}
        </span>
      )}
    </div>
  );
}

interface GroupSectionProps {
  groupKey: GroupKey;
  tasks: Task[];
  projects: ReturnType<typeof useAppStore.getState>['projects'];
  updateTask: (id: string, patch: Partial<Task>) => void;
}

function GroupSection({ groupKey, tasks, projects, updateTask }: GroupSectionProps) {
  const [open, setOpen] = useState(true);
  const meta = GROUP_META[groupKey];
  if (tasks.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        className="flex items-center gap-2 px-4 py-2 w-full text-left group"
        onClick={() => setOpen((o) => !o)}
      >
        {open
          ? <ChevronDown size={14} className="text-zinc-400" />
          : <ChevronRight size={14} className="text-zinc-400" />
        }
        {meta.icon}
        <span className={cn('text-xs font-semibold', meta.color)}>{meta.label}</span>
        <span className="ml-1 text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </button>

      {open && (
        <div className="ml-4 border-l border-zinc-100 pl-2">
          {tasks.map((task) => {
            const proj   = projects[task.projectId];
            const status = proj?.workflow.find((w) => w.id === task.statusId);
            return (
              <TaskRow
                key={task.id}
                task={task}
                projectName={proj?.name ?? '알 수 없음'}
                projectColor={proj?.color ?? '#94a3b8'}
                statusLabel={status?.label ?? ''}
                statusColor={status?.color ?? '#94a3b8'}
                onDone={() => {
                  if (task.statusId.endsWith('-done') || task.statusId === 'done') return;
                  const doneStatus = proj?.workflow.find((w) => w.id.endsWith('-done') || w.id === 'done');
                  if (doneStatus) updateTask(task.id, { statusId: doneStatus.id });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MyTasksPage() {
  const tasks      = useAppStore(s => s.tasks);
  const projects   = useAppStore(s => s.projects);
  const updateTask = useAppStore(s => s.updateTask);
  const currentUser = useAuthStore(s => s.currentUser);

  const [showDone, setShowDone] = useState(false);

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return Object.values(tasks).filter((t) =>
      t.assigneeIds.includes(currentUser.id)
    );
  }, [tasks, currentUser]);

  const activeTasks = useMemo(() => myTasks.filter((t) =>
    !t.statusId.endsWith('-done') && t.statusId !== 'done'
  ), [myTasks]);

  const doneTasks = useMemo(() => myTasks.filter((t) =>
    t.statusId.endsWith('-done') || t.statusId === 'done'
  ), [myTasks]);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, Task[]> = {
      overdue: [], today: [], this_week: [], later: [], no_date: [],
    };
    for (const t of activeTasks) {
      map[getGroup(t)].push(t);
    }
    // sort each group by dueDate, then priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (const list of Object.values(map)) {
      list.sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 9)
             - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 9);
      });
    }
    return map;
  }, [activeTasks]);

  const totalActive  = activeTasks.length;
  const overdueCount = grouped.overdue.length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="내 업무"
        subtitle={`${totalActive}개 진행 중${overdueCount > 0 ? ` · 기한 초과 ${overdueCount}개` : ''}`}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Summary bar */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-6 flex-wrap">
          {(Object.entries(PRIORITY_LABEL) as [string, { label: string; color: string }][]).map(([key, val]) => {
            const cnt = activeTasks.filter((t) => t.priority === key).length;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn('text-[11px] px-1.5 py-0.5 rounded font-semibold', val.color)}>
                  {val.label}
                </span>
                <span className="text-xs text-zinc-500 font-medium">{cnt}개</span>
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-zinc-400">완료 {doneTasks.length}개</span>
            <button
              onClick={() => setShowDone((v) => !v)}
              className="text-xs text-zinc-900 hover:underline"
            >
              {showDone ? '숨기기' : '보기'}
            </button>
          </div>
        </div>

        <div className="py-3 px-2">
          {totalActive === 0 && doneTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <CheckCircle2 size={28} className="text-zinc-300" />
              </div>
              <p className="text-sm font-semibold text-zinc-600 mb-1">할 일이 없습니다</p>
              <p className="text-xs text-zinc-400">담당자로 지정된 업무가 표시됩니다.</p>
            </div>
          ) : (
            <>
              {(Object.keys(PRIORITY_LABEL) as GroupKey[]).length > 0 && (
                <>
                  {(['overdue', 'today', 'this_week', 'later', 'no_date'] as GroupKey[]).map((key) => (
                    <GroupSection
                      key={key}
                      groupKey={key}
                      tasks={grouped[key]}
                      projects={projects}
                      updateTask={updateTask}
                    />
                  ))}
                </>
              )}

              {/* Done section */}
              {showDone && doneTasks.length > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span className="text-xs font-semibold text-zinc-500">완료된 업무</span>
                    <span className="text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full font-medium">
                      {doneTasks.length}
                    </span>
                  </div>
                  <div className="ml-4 border-l border-zinc-100 pl-2">
                    {doneTasks.map((task) => {
                      const proj   = projects[task.projectId];
                      const status = proj?.workflow.find((w) => w.id === task.statusId);
                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          projectName={proj?.name ?? '알 수 없음'}
                          projectColor={proj?.color ?? '#94a3b8'}
                          statusLabel={status?.label ?? ''}
                          statusColor={status?.color ?? '#94a3b8'}
                          onDone={() => {}}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
