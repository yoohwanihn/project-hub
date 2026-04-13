import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, UserMinus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { ColorPicker } from '../ui/ColorPicker';
import { Select, MultiSelect, type SelectOption } from '../ui/MultiSelect';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import type { Project, WorkflowStatus } from '../../types';
import { DEFAULT_WORKFLOW } from '../../types';
import { cn } from '../../lib/utils';
import { nanoid } from '../../store/nanoid';

// ── WorkflowEditor ────────────────────────────────────────────
function WorkflowEditor({
  workflow,
  onChange,
}: {
  workflow: WorkflowStatus[];
  onChange: (wf: WorkflowStatus[]) => void;
}) {
  function add() {
    onChange([...workflow, { id: nanoid(), label: '새 상태', color: '#94a3b8', order: workflow.length }]);
  }

  function remove(id: string) {
    if (workflow.length <= 2) return; // minimum 2 statuses
    onChange(workflow.filter((w) => w.id !== id).map((w, i) => ({ ...w, order: i })));
  }

  function patch(id: string, key: keyof WorkflowStatus, val: string | number) {
    onChange(workflow.map((w) => (w.id === id ? { ...w, [key]: val } : w)));
  }

  return (
    <div className="space-y-2">
      {workflow.map((w) => (
        <div key={w.id} className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300 flex-shrink-0 cursor-grab" />
          <input
            type="color"
            value={w.color}
            onChange={(e) => patch(w.id, 'color', e.target.value)}
            className="w-7 h-7 rounded-lg border-0 p-0.5 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={w.label}
            onChange={(e) => patch(w.id, 'label', e.target.value)}
            className="input flex-1 text-sm py-1.5"
            maxLength={20}
          />
          <button
            type="button"
            onClick={() => remove(w.id)}
            disabled={workflow.length <= 2}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      {workflow.length < 8 && (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-800 font-medium mt-1"
        >
          <Plus size={13} /> 상태 추가
        </button>
      )}
    </div>
  );
}

// ── ProjectModal ───────────────────────────────────────────────
interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: Project; // undefined → create mode
}

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const { users, createProject, updateProject } = useAppStore((s) => ({
    users: s.users,
    createProject: s.createProject,
    updateProject: s.updateProject,
  }));
  const currentUserId = useAppStore((s) => s.currentUserId);

  const isEdit = !!project;

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [color,       setColor]       = useState('#3b82f6');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [memberIds,   setMemberIds]   = useState<string[]>([]);
  const [workflow,    setWorkflow]    = useState<WorkflowStatus[]>([...DEFAULT_WORKFLOW]);
  const [tab,         setTab]         = useState<'info' | 'workflow' | 'members'>('info');

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setColor(project.color);
      setStartDate(project.startDate);
      setEndDate(project.endDate);
      setMemberIds(project.members.map((m) => m.id));
      setWorkflow(project.workflow.map((w) => ({ ...w })));
    } else {
      setName('');
      setDescription('');
      setColor('#3b82f6');
      setStartDate('');
      setEndDate('');
      setMemberIds([currentUserId]);
      setWorkflow([...DEFAULT_WORKFLOW]);
    }
    setTab('info');
  }, [open, project, currentUserId]);

  const userOptions: SelectOption[] = Object.values(users).map((u) => ({
    value: u.id,
    label: u.name,
  }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const members = memberIds
      .map((id) => users[id])
      .filter(Boolean)
      .map((u, i) => ({ ...u, role: i === 0 ? ('owner' as const) : ('member' as const) }));

    if (isEdit) {
      updateProject(project.id, { name, description, color, startDate, endDate, members, workflow });
    } else {
      createProject({
        name, description, color, startDate, endDate, members, workflow, tags: [],
      });
    }
    onClose();
  }

  const valid = name.trim().length > 0 && startDate && endDate;

  const TABS = [
    { id: 'info'     as const, label: '기본 정보' },
    { id: 'workflow' as const, label: '워크플로우' },
    { id: 'members'  as const, label: '팀원 관리' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '프로젝트 수정' : '새 프로젝트'}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
          <button
            type="submit"
            form="project-form"
            disabled={!valid}
            className="btn-primary disabled:opacity-50"
          >
            {isEdit ? '저장' : '프로젝트 생성'}
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
          </button>
        ))}
      </div>

      <form id="project-form" onSubmit={submit}>
        {/* Info tab */}
        {tab === 'info' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              {/* Color swatch preview */}
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: color }}
              >
                {name.charAt(0) || 'P'}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">프로젝트명 *</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="프로젝트명을 입력하세요"
                  maxLength={50}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">설명</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="프로젝트 목표와 범위를 간략히 적어주세요"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">프로젝트 색상</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">시작일 *</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">마감일 *</label>
                <input
                  type="date"
                  className="input"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Workflow tab */}
        {tab === 'workflow' && (
          <div>
            <p className="text-xs text-slate-500 mb-4">
              업무 상태 컬럼을 원하는 대로 추가하거나 이름과 색상을 변경할 수 있습니다.
              최소 2개, 최대 8개까지 설정 가능합니다.
            </p>
            <WorkflowEditor workflow={workflow} onChange={setWorkflow} />
          </div>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">팀원 추가</label>
              <MultiSelect
                options={userOptions}
                value={memberIds}
                onChange={setMemberIds}
                placeholder="팀원을 선택하세요"
              />
            </div>

            <div className="space-y-2">
              {memberIds.map((uid, idx) => {
                const u = users[uid];
                if (!u) return null;
                return (
                  <div key={uid} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <Avatar name={u.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                    <span className={cn(
                      'badge',
                      idx === 0 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600',
                    )}>
                      {idx === 0 ? '소유자' : '멤버'}
                    </span>
                    {uid !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setMemberIds((ids) => ids.filter((id) => id !== uid))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <UserMinus size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
