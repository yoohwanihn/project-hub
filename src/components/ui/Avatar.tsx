import { getInitials, cn } from '../../lib/utils';

const COLORS = [
  'bg-zinc-700', 'bg-zinc-500', 'bg-zinc-800', 'bg-zinc-600',
  'bg-zinc-900', 'bg-zinc-400', 'bg-zinc-700', 'bg-zinc-600',
];

function colorFromName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-white', SIZE[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white flex-shrink-0',
        colorFromName(name), SIZE[size], className,
      )}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatar?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const rest = users.length - max;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((u) => (
        <Avatar key={u.id} name={u.name} src={u.avatar} size={size} />
      ))}
      {rest > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center rounded-full bg-zinc-200 text-zinc-600 font-semibold ring-2 ring-white',
          SIZE[size],
        )}>
          +{rest}
        </span>
      )}
    </div>
  );
}
