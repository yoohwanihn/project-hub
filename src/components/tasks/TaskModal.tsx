import { useState, useEffect } from 'react';
import { Plus, Trash2, Link2, X, Clock, Tag } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Select, MultiSelect, type SelectOption } from '../ui/MultiSelect';
import { TagColorPicker } from '../ui/ColorPicker';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import type { Task, Priority } from '../../types';
import { PRIORITY_LABEL, cn } from '../../lib/utils';
import { nanoid } from '../../store/nanoid';

// ── Tag manager (inline within TaskModal) ──────────────────────
function TagManagerSection({ projectId }: { projectId: string }) {
  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const { tags, createTag, updateTag, deleteTag } = useAppStore((s) => ({
    tags:      s.projects[projectId]?.tags ?? [],
    createTag: s.createTag,
    updateTag: s.updateTag,
    deleteTag: s.deleteTag,
  }));

  function add() {
    if (!newName.trim()) return;
    createTag(projectId, newName.trim(), newColor);
    setNewName('');
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 group">
            <input
              type="color"
              value={tag.color}
              onChange={(e) => updateTag(projectId, tag.id, { color: e.target.value })}
              className="w-6 h-6 rounded border-0 p-0.5 cursor-pointer bg-transparent"
            />
            <input
              className="input flex-1 text-sm py-1.5"
              value={tag.name}
              onChange={(e) => updateTag(projectId, tag.id, { name: e.target.value })}
              maxLength={20}
            />
            <button
              type="button"
              onClick={() => deleteTag(projectId, tag.id)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">아직 태그가 없습니다.</p>
        )}
      </div>

      {/* Add new tag */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-6 h-6 rounded border-0 p-0.5 cursor-pointer bg-transparent"
        />
        <input
          className="input flex-1 text-sm py-1.5"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 태그 이름"
          maxLength={20}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <button
          type="button"
          onClick={add}
          className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
        >
          <Plus size={12} /> 추가
        </button>
      </div>
    </div>
  );
}

// ── DependencySelector ─────────────────────────────────────────
function DependencySelector({
  projectId,
  currentTaskId,
  blockedBy,
  onChange,
}: {
  projectId: string;
  currentTaskId?: string;
  blockedBy: string[];
  onChange: (ids: string[]) => void;
}) {
  const { tasks } = useAppStore((s) => ({
    tasks: Object.values(s.tasks).filter(
      (t) => t.projectId === projectId && t.id !== currentTaskId,
    ),
  }));

  const [search, setSearch] = useState('');
  const filtered = tasks.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) && !blockedBy.includes(t.id),
  );

  return (
    <div className="space-y-3">
      {/* Selected */}
      {blockedBy.length > 0 && (
        <div className="space-y-1.5">
          {blockedBy.map((id) => {
            const t = tasks.find((x) => x.id === id);
            if (!t) return null;
            return (
              <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <Link2 size={12} className="text-amber-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 flex-1 truncate">{t.title}</span>
                <button
                  type="button"
                  onClick={() => onChange(blockedBy.filter((x) => x !== id))}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & add */}
      <div>
        <input
          className="input text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="선행 업무 검색..."
        />
        {search && (
          <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
            {filtered.slice(0, 8).map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs"
                onClick={() => { onChange([...blockedBy, t.id]); setSearch(''); }}
              >
                <Link2 size={11} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{t.title}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {tasks.length === 0 && blockedBy.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">같은 프로젝트의 다른 업무가 없습니다.</p>
      )}
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────
interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: Task;        // undefined → create mode
  defaultStatusId?: string;
}

export function TaskModal({ open, onClose, projectId, task, defaultStatusId }: TaskModalProps) {
  const { project, users, createTask, updateTask } = useAppStore((s) => ({
    project:    s.projects[projectId],
    users:      s.users,
    createTask: s.createTask,
    updateTask: s.updateTask,
  }));

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
  const [tab,            setTab]            = useState<'basic' | 'detail' | 'deps'>('basic');

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
    setTab('basic');
  }, [open, task, defaultStatusId, project]);

  if (!project) return null;

  const statusOptions: SelectOption[] = project.workflow
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((w) => ({ value: w.id, label: w.label, color: w.color }));

  const priorityOptions: SelectOption[] = (
    ['low', 'medium', 'high', 'urgent'] as Priority[]
  ).map((p) => ({ value: p, label: PRIORITY_LABEL[p] }));

  const memberOptions: SelectOption[] = project.members.map((m) => ({
    value: m.id,
    label: m.name,
  }));

  const tagOptions: SelectOption[] = project.tags.map((t) => ({
    value: t.id,
    label: t.name,
    color: t.color,
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

  const TABS = [
    { id: 'basic'  as const, label: '기본' },
    { id: 'detail' as const, label: '상세' },
    { id: 'deps'   as const, label: '선후행 관계' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '업무 수정' : '새 업무 추가'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
          <button
            type="submit"
            form="task-form"
            disabled={!valid}
            className="btn-primary disabled:opacity-50"
          >
            {isEdit ? '저장' : '업무 추가'}
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 -mx-6 px-6 mb-5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={cn(
              'px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'deps' && blockedBy.length > 0 && (
              <span className="ml-1.5 badge bg-amber-100 text-amber-700">{blockedBy.length}</span>
            )}
          </button>
        ))}
      </div>

      <form id="task-form" onSubmit={submit}>
        {/* Basic */}
        {tab === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">업무명 *</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">설명</label>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">상태</label>
                <Select options={statusOptions} value={statusId} onChange={setStatusId} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">우선순위</label>
                <Select options={priorityOptions} value={priority} onChange={(v) => setPriority(v as Priority)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">담당자</label>
              <MultiSelect
                options={memberOptions}
                value={assigneeIds}
                onChange={setAssigneeIds}
                placeholder="담당자를 선택하세요"
                renderTag={(opt, onRemove) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100"
                  >
                    <Avatar name={opt.label} size="xs" />
                    {opt.label}
                    <button type="button" onClick={onRemove} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </span>
                )}
              />
            </div>

            {tagOptions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  <span className="flex items-center gap-1"><Tag size={11} /> 태그</span>
                </label>
                <MultiSelect
                  options={tagOptions}
                  value={tagIds}
                  onChange={setTagIds}
                  placeholder="태그를 선택하세요"
                  renderTag={(opt, onRemove) => (
                    <span
                      key={opt.value}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${opt.color}20`, color: opt.color }}
                    >
                      {opt.label}
                      <button type="button" onClick={onRemove}><X size={10} /></button>
                    </span>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Detail */}
        {tab === 'detail' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">시작일</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">마감일</label>
                <input
                  type="date"
                  className="input text-sm"
                  value={dueDate}
                  min={startDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                <span className="flex items-center gap-1"><Clock size={11} /> 예상 소요 시간 (시간)</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                className="input text-sm w-36"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="8"
              />
            </div>

            {/* Tag management */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">태그 관리</label>
              <div className="card p-4">
                <TagManagerSection projectId={projectId} />
              </div>
            </div>
          </div>
        )}

        {/* Dependencies */}
        {tab === 'deps' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
              선행 업무가 완료되어야 이 업무를 시작할 수 있습니다.
              선후행 관계는 칸반 보드와 간트차트에 시각화됩니다.
            </div>
            <DependencySelector
              projectId={projectId}
              currentTaskId={task?.id}
              blockedBy={blockedBy}
              onChange={setBlockedBy}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
