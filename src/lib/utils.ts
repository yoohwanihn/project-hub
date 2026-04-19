import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'yyyy.MM.dd') {
  return format(new Date(date), pattern, { locale: ko });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name.slice(0, 1);
}

export const PRIORITY_LABEL: Record<string, string> = {
  low: '낮음', medium: '보통', high: '높음', urgent: '긴급',
};

export const PRIORITY_COLOR: Record<string, string> = {
  low:    'bg-zinc-50 text-zinc-400',
  medium: 'bg-zinc-100 text-zinc-600',
  high:   'bg-zinc-200 text-zinc-800',
  urgent: 'bg-zinc-900 text-white',
};

export const STATUS_LABEL: Record<string, string> = {
  todo: '진행 전', in_progress: '진행 중', review: '검토 중', done: '완료',
};

export const STATUS_COLOR: Record<string, string> = {
  todo:        'bg-zinc-50 text-zinc-500',
  in_progress: 'bg-zinc-100 text-zinc-700',
  review:      'bg-zinc-200 text-zinc-700',
  done:        'bg-zinc-900 text-white',
};
