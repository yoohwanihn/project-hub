import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Link2, X, Clock, Tag, Timer } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Select, MultiSelect, type SelectOption } from '../ui/MultiSelect';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Task, Priority } from '../../types';
import { PRIORITY_LABEL, cn, formatDate } from '../../lib/utils';

// ── WorkLogSection ─────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);

function WorkLogSection({ task }: { task: Task }) {
  const workLogsMap   = useAppStore(s => s.workLogs);
  const users         = useAppStore(s => s.users);
  const currentUserId = useAuthStore(s => s.currentUser?.id ?? '');
  const addWorkLog    = useAppStore(s => s.addWorkLog);
  const deleteWorkLog = useAppStore(s => s.deleteWorkLog);
  const workLogs = useMemo(
    () => Object.values(workLogsMap).filter((w) => w.taskId === task.id).sort((a, b) => b.date.localeCompare(a.date)),
    [workLogsMap, task.id],
  );

  const [logHours, setLogHours] = useState('');
  const [logNote,  setLogNote]  = useState('');
  const [logDate,  setLogDate]  = useState(TODAY);

  function submit() {
    const h = parseFloat(logHours);
    if (!h || h <= 0) return;
    addWorkLog({ taskId: task.id, userId: currentUserId, hours: h, note: logNote.trim(), date: logDate });
    setLogHours('');
    setLogNote('');
    setLogDate(TODAY);
  }

  const pct = task.estimatedHours
    ? Math.min(100, Math.round((task.loggedHours / task.estimatedHours) * 100))
    : null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-600">시간 현황</span>
          <span className="text-xs text-zinc-500">
            <span className="font-bold text-zinc-800">{task.loggedHours}h</span>
            {task.estimatedHours && <span className="text-zinc-400"> / {task.estimatedHours}h 예상</span>}
          </span>
        </div>
        {task.estimatedHours ? (
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', pct! >= 100 ? 'bg-red-400' : pct! >= 80 ? 'bg-amber-400' : 'bg-zinc-700')}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : (
          <p className="text-xs text-zinc-400">예상 소요 시간이 설정되지 않았습니다.</p>
        )}
        {pct !== null && (
          <p className={cn('text-xs mt-1.5 font-medium', pct >= 100 ? 'text-red-500' : 'text-zinc-500')}>
            {pct >= 100 ? `⚠ 예상 시간 초과 (+${task.loggedHours - task.estimatedHours!}h)` : `${pct}% 사용`}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-100 p-4 space-y-3">
        <p className="text-xs font-semibold text-zinc-600">시간 기록 추가</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">소요 시간 (h) *</label>
            <input type="number" min={0.5} step={0.5} className="input text-sm"
              value={logHours} onChange={(e) => setLogHours(e.target.value)} placeholder="1.5" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">날짜</label>
            <input type="date" className="input text-sm"
              value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">작업 메모 (선택)</label>
          <input className="input text-sm" value={logNote} onChange={(e) => setLogNote(e.target.value)}
            placeholder="어떤 작업을 했는지 간략히..." onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <button type="button" className="btn-primary w-full text-xs"
          disabled={!logHours || parseFloat(logHours) <= 0} onClick={submit}>
          <Plus size={13} /> 기록 추가
        </button>
      </div>

      {workLogs.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-zinc-500 mb-2">기록 내역 ({workLogs.length}건)</p>
          {workLogs.map((wl) => (
            <div key={wl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-50 group">
              <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                <Timer size={11} className="text-zinc-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-800">{wl.hours}h</span>
                  <span className="text-xs text-zinc-400">{formatDate(wl.date, 'MM.dd')}</span>
                  {users[wl.userId] && <span className="text-xs text-zinc-400">{users[wl.userId].name}</span>}
                </div>
                {wl.note && <p className="text-xs text-zinc-500 truncate mt-0.5">{wl.note}</p>}
              </div>
              <button type="button"
                className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                onClick={() => deleteWorkLog(wl.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-400 text-center py-4">아직 시간 기록이 없습니다.</p>
      )}
    </div>
  );
}

// ── TagManagerSection ──────────────────────────────────────────
function TagManagerSection({ projectId }: { projectId: string }) {
  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const project   = useAppStore(s => s.projects[projectId]);
  const tags      = project?.tags ?? [];
  const createTag = useAppStore(s => s.createTag);
  const updateTag = useAppStore(s => s.updateTag);
  const deleteTag = useAppStore(s => s.deleteTag);

  function add() {
    if (!newName.trim()) return;
    createTag(projectId, newName.trim(), newColor);
    setNewName('');
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 group">
            <input type="color" value={tag.color}
              onChange={(e) => updateTag(projectId, tag.id, { color: e.target.value })}
              className="w-6 h-6 rounded border-0 p-0.5 cursor-pointer bg-transparent" />
            <input className="input flex-1 text-sm py-1.5" value={tag.name}
              onChange={(e) => updateTag(projectId, tag.id, { name: e.target.value })} maxLength={20} />
            <button type="button" onClick={() => deleteTag(projectId, tag.id)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-xs text-zinc-400 text-center py-2">아직 태그가 없습니다.</p>}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
          className="w-6 h-6 rounded border-0 p-0.5 cursor-pointer bg-transparent" />
        <input className="input flex-1 text-sm py-1.5" value={newName}
          onChange={(e) => setNewName(e.target.value)} placeholder="새 태그 이름" maxLength={20}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button type="button" onClick={add} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
          <Plus size={12} /> 추가
        </button>
      </div>
    </div>
  );
}

// ── DependencySelector ─────────────────────────────────────────
function DependencySelector({
  projectId, currentTaskId, blockedBy, onChange,
}: {
  projectId: string;
  currentTaskId?: string;
  blockedBy: string[];
  onChange: (ids: string[]) => void;
}) {
  const tasksMap = useAppStore(s => s.tasks);
  const tasks = useMemo(
    () => Object.values(tasksMap).filter((t) => t.projectId === projectId && t.id !== currentTaskId),
    [tasksMap, projectId, currentTaskId],
  );
  const [search, setSearch] = useState('');
  const filtered = tasks.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) && !blockedBy.includes(t.id),
  );

  return (
    <div className="space-y-2">
      {blockedBy.length > 0 && (
        <div className="space-y-1.5">
          {blockedBy.map((id) => {
            const t = tasks.find((x) => x.id === id);
            if (!t) return null;
            return (
              <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <Link2 size={12} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs text-zinc-700 flex-1 truncate">{t.title}</span>
                <button type="button" onClick={() => onChange(blockedBy.filter((x) => x !== id))}
                  className="text-zinc-400 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div>
        <input className="input text-sm" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="선행 업무 검색..." />
        {search && (
          <div className="mt-1 border border-zinc-200 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
            {filtered.slice(0, 8).map((t) => (
              <button key={t.id} type="button"
                className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 text-xs"
                onClick={() => { onChange([...blockedBy, t.id]); setSearch(''); }}>
                <Link2 size={11} className="text-zinc-400 flex-shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-zinc-400 text-center py-3">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>
      {tasks.length === 0 && blockedBy.length === 0 && (
        <p className="text-xs text-zinc-400 text-center py-2">같은 프로젝트의 다른 업무가 없습니다.</p>
      )}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-zinc-100" />
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────
interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task;
  defaultStatusId?: string;
}

export function TaskModal({ open, onClose, projectId, task, defaultStatusId }: TaskModalProps) {
  const project    = useAppStore(s => s.projects[projectId]);
  const createTask = useAppStore(s => s.createTask);
  const updateTask = useAppStore(s => s.updateTask);

  const isEdit = !!task;

  const [title,          setTitle]          = useState('');
  const [description,    setDescription]    = useState('');
  const [statusId,       setStatusId]       = useState('');
  const [priority,       setPriority]       = useState<Priority>('medium');
  const [assigneeIds,    setAssigneeIds]    = useState<string[]>([]);
  const [tagIds,         setTagIds]         = useState<string[]>([]);
  const [startDate,      setStartDate]      = useState('');
  const [dueDate,        setDueDate]        = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [blockedBy,      setBlockedBy]      = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatusId(task.statusId);
      setPriority(task.priority);
      setAssigneeIds([...task.assigneeIds]);
      setTagIds([...task.tagIds]);
      setStartDate(task.startDate ?? '');
      setDueDate(task.dueDate ?? '');
      setEstimatedHours(task.estimatedHours?.toString() ?? '');
      setBlockedBy([...task.blockedBy]);
    } else {
      setTitle('');
      setDescription('');
      setStatusId(defaultStatusId ?? project?.workflow[0]?.id ?? 'todo');
      setPriority('medium');
      setAssigneeIds([]);
      setTagIds([]);
      setStartDate('');
      setDueDate('');
      setEstimatedHours('');
      setBlockedBy([]);
    }
  }, [open, task, defaultStatusId, project]);

  if (!project) return null;

  const statusOptions: SelectOption[] = project.workflow
    .slice().sort((a, b) => a.order - b.order)
    .map((w) => ({ value: w.id, label: w.label, color: w.color }));

  const priorityOptions: SelectOption[] = (
    ['low', 'medium', 'high', 'urgent'] as Priority[]
  ).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }));

  const memberOptions: SelectOption[] = project.members.map((m) => ({
    value: m.id, label: m.name,
  }));

  const tagOptions: SelectOption[] = project.tags.map((t) => ({
    value: t.id, label: t.name, color: t.color,
  }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      updateTask(task.id, {
        title, description, statusId, priority,
        assigneeIds, tagIds,
        startDate: startDate || undefined,
        dueDate:   dueDate   || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        blockedBy,
      });
    } else {
      createTask({
        projectId, title, description, statusId, priority,
        assigneeIds, tagIds,
        startDate: startDate || undefined,
        dueDate:   dueDate   || undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        blockedBy,
        parentId: undefined,
      });
    }
    onClose();
  }

  const valid = title.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '업무 수정' : '새 업무 추가'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
          <button type="submit" form="task-form" disabled={!valid} className="btn-primary disabled:opacity-50">
            {isEdit ? '저장' : '업무 추가'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">

        {/* ── 기본 정보 ── */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">업무명 *</label>
          <input
            className="input text-sm font-medium"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="업무 내용을 간결하게 입력하세요"
            maxLength={100}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">설명</label>
          <textarea
            className="input resize-none text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 내용, 완료 조건, 참고사항 등을 적어주세요"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">상태</label>
            <Select options={statusOptions} value={statusId} onChange={setStatusId} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">우선순위</label>
            <Select options={priorityOptions} value={priority} onChange={(v) => setPriority(v as Priority)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">담당자</label>
          <MultiSelect
            options={memberOptions}
            value={assigneeIds}
            onChange={setAssigneeIds}
            placeholder="담당자를 선택하세요"
            renderTag={(opt, onRemove) => (
              <span key={opt.value} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-zinc-100">
                <Avatar name={opt.label} size="xs" />
                {opt.label}
                <button type="button" onClick={onRemove} className="hover:text-red-500"><X size={10} /></button>
              </span>
            )}
          />
        </div>

        {tagOptions.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">
              <span className="flex items-center gap-1"><Tag size={11} /> 태그</span>
            </label>
            <MultiSelect
              options={tagOptions}
              value={tagIds}
              onChange={setTagIds}
              placeholder="태그를 선택하세요"
              renderTag={(opt, onRemove) => (
                <span key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${opt.color}20`, color: opt.color }}>
                  {opt.label}
                  <button type="button" onClick={onRemove}><X size={10} /></button>
                </span>
              )}
            />
          </div>
        )}

        {/* ── 일정 & 시간 ── */}
        <SectionHeader label="일정 & 시간" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">시작일</label>
            <input type="date" className="input text-sm"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">마감일</label>
            <input type="date" className="input text-sm"
              value={dueDate} min={startDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 mb-1">
            <span className="flex items-center gap-1"><Clock size={11} /> 예상 소요 시간 (h)</span>
          </label>
          <input type="number" min={0} step={0.5} className="input text-sm w-36"
            value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="8" />
        </div>

        {/* ── 선후행 관계 ── */}
        <SectionHeader label="선후행 관계" />
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
          선행 업무가 완료되어야 이 업무를 시작할 수 있습니다.
        </p>
        <DependencySelector
          projectId={projectId}
          currentTaskId={task?.id}
          blockedBy={blockedBy}
          onChange={setBlockedBy}
        />

        {/* ── 태그 관리 ── */}
        <SectionHeader label="태그 관리" />
        <div className="card p-4">
          <TagManagerSection projectId={projectId} />
        </div>

        {/* ── 시간 기록 (수정 모드만) ── */}
        {isEdit && task && (
          <>
            <SectionHeader label="시간 기록" />
            <WorkLogSection task={task} />
          </>
        )}
      </form>
    </Modal>
  );
}
