import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/useToastStore';
import { cn } from '../../lib/utils';

const STYLES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
  error:   { icon: XCircle,      bar: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50 border-red-100' },
  info:    { icon: Info,         bar: 'bg-zinc-600',    text: 'text-zinc-700',    bg: 'bg-zinc-50 border-zinc-200' },
  warning: { icon: AlertTriangle,bar: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore(s => s.remove);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const style = STYLES[toast.type];
  const Icon  = style.icon;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3.5 w-96 rounded-2xl border px-5 py-4 shadow-lg overflow-hidden',
        'transition-all duration-300',
        style.bg,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      )}
    >
      {/* progress bar */}
      <div
        className={cn('absolute bottom-0 left-0 h-0.5 animate-shrink', style.bar)}
        style={{ animationDuration: `${toast.duration ?? 5000}ms` }}
      />
      <Icon size={18} className={cn('mt-0.5 flex-shrink-0', style.text)} />
      <p className={cn('text-sm font-medium flex-1 leading-relaxed', style.text)}>{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className={cn('flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity', style.text)}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
