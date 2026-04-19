import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max = 100, className, color, showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const barColor = color
    ? undefined
    : pct >= 80
    ? 'bg-zinc-800'
    : pct >= 50
    ? 'bg-zinc-600'
    : pct >= 25
    ? 'bg-zinc-400'
    : 'bg-zinc-200';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>}
    </div>
  );
}
