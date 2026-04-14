import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { nanoid } from '../../store/nanoid';
import type { Poll, PollOption } from '../../types';

interface Props {
  open: boolean;
  projectId: string;
  authorId: string;
  onClose: () => void;
  onSubmit: (data: Omit<Poll, 'id' | 'createdAt'>) => void;
}

function makeOption(label = ''): PollOption {
  return { id: nanoid(), label, voterIds: [] };
}

export function PollCreateModal({ open, projectId, authorId, onClose, onSubmit }: Props) {
  const [title, setTitle]           = useState('');
  const [desc, setDesc]             = useState('');
  const [options, setOptions]       = useState<PollOption[]>([makeOption(), makeOption()]);
  const [isMultiple, setIsMultiple] = useState(false);
  const [showBefore, setShowBefore] = useState(true);
  const [dueDate, setDueDate]       = useState('');

  function reset() {
    setTitle(''); setDesc('');
    setOptions([makeOption(), makeOption()]);
    setIsMultiple(false); setShowBefore(true); setDueDate('');
  }

  function handleClose() { reset(); onClose(); }

  function addOption() {
    if (options.length >= 10) return;
    setOptions((prev) => [...prev, makeOption()]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateOptionLabel(idx: number, label: string) {
    setOptions((prev) => prev.map((o, i) => i === idx ? { ...o, label } : o));
  }

  const isValid =
    title.trim() !== '' &&
    options.length >= 2 &&
    options.every((o) => o.label.trim() !== '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      projectId,
      title:                  title.trim(),
      description:            desc.trim(),
      options,
      isMultiple,
      showResultsBeforeClose: showBefore,
      status:                 'active',
      dueDate:                dueDate || undefined,
      authorId,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="투표 만들기" size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={handleClose}>취소</button>
          <button type="submit" form="poll-form" className="btn-primary" disabled={!isValid}>
            투표 생성
          </button>
        </>
      }
    >
      <form id="poll-form" onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">제목 *</label>
          <input
            className="input"
            placeholder="투표 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">설명</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="투표 목적이나 안내 사항을 입력하세요"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* 선택지 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            선택지 * <span className="font-normal text-slate-400">({options.length}/10)</span>
          </label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-4 text-right">{idx + 1}</span>
                <input
                  className="input flex-1"
                  placeholder={`선택지 ${idx + 1}`}
                  value={opt.label}
                  onChange={(e) => updateOptionLabel(idx, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  disabled={options.length <= 2}
                  className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              <Plus size={13} /> 선택지 추가
            </button>
          )}
        </div>

        {/* 옵션 설정 */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-700 mb-2">선택 방식</p>
            <div className="flex gap-3">
              {([false, true] as const).map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isMultiple"
                    checked={isMultiple === v}
                    onChange={() => setIsMultiple(v)}
                    className="accent-primary-600"
                  />
                  <span className="text-xs text-slate-600">{v ? '복수 선택' : '단일 선택'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-700 mb-2">결과 공개</p>
            <div className="flex gap-3">
              {([true, false] as const).map((v) => (
                <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="showBefore"
                    checked={showBefore === v}
                    onChange={() => setShowBefore(v)}
                    className="accent-primary-600"
                  />
                  <span className="text-xs text-slate-600">{v ? '실시간' : '마감 후'}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 마감일 */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            마감일 <span className="font-normal text-slate-400">(선택)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input w-48"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
            {dueDate && (
              <button
                type="button"
                onClick={() => setDueDate('')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} /> 제거
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
