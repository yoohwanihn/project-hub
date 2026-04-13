import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  color?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', color, className }: BadgeProps) {
  return (
    <span
      className={cn('badge', variant === 'outline' && 'border', className)}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {children}
    </span>
  );
}

interface TagBadgeProps {
  name: string;
  color: string;
}

export function TagBadge({ name, color }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {name}
    </span>
  );
}
