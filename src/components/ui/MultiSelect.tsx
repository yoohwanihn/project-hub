import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

// ── Single Select ──────────────────────────────────────────────
interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder = '선택', className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        className="input flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.color && (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
          )}
          <span className={cn('truncate', !selected && 'text-zinc-400')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown size={13} className={cn('text-zinc-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-modal overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors',
                  opt.value === value && 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50',
                )}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.color && (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                {opt.icon}
                <span className="flex-1 truncate">{opt.label}</span>
                {opt.value === value && <Check size={13} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi Select ───────────────────────────────────────────────
interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  renderTag?: (opt: SelectOption, onRemove: () => void) => React.ReactNode;
}

export function MultiSelect({ options, value, onChange, placeholder = '선택', className, renderTag }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.filter((o) => value.includes(o.value));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div
        className="input min-h-[38px] flex flex-wrap gap-1.5 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length === 0 && (
          <span className="text-zinc-400 text-sm">{placeholder}</span>
        )}
        {selected.map((opt) =>
          renderTag ? (
            renderTag(opt, () => toggle(opt.value))
          ) : (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              {opt.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />}
              {opt.label}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(opt.value); }}
                className="hover:text-zinc-900"
              >
                <X size={10} />
              </button>
            </span>
          ),
        )}
        <ChevronDown
          size={13}
          className={cn('text-zinc-400 ml-auto self-center flex-shrink-0 transition-transform', open && 'rotate-180')}
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-modal overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    'w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors',
                    isSelected && 'bg-zinc-100 dark:bg-zinc-700',
                  )}
                  onClick={() => toggle(opt.value)}
                >
                  {opt.color && (
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                  )}
                  {opt.icon}
                  <span className={cn('flex-1 truncate', isSelected && 'font-medium text-zinc-900 dark:text-zinc-50')}>{opt.label}</span>
                  {isSelected && <Check size={13} className="text-zinc-900 dark:text-zinc-100 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
