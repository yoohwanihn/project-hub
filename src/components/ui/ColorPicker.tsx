import { cn } from '../../lib/utils';

export const PALETTE = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#64748b', '#374151', '#1e293b',
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-6 h-6 rounded-full ring-offset-2 transition-all',
            value === color ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-110',
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}

interface TagColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function TagColorPicker({ value, onChange }: TagColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-5 h-5 rounded-full ring-offset-1 transition-all',
            value === color ? 'ring-2 ring-slate-500 scale-110' : 'hover:scale-105',
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
