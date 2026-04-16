import { Bell, Search, HelpCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const currentUser = useAuthStore(s => s.currentUser);

  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-sm font-bold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-52">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="검색..."
            className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full text-slate-700"
          />
        </div>

        {actions}

        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <HelpCircle size={16} />
        </button>

        {currentUser && <Avatar name={currentUser.name} size="sm" className="cursor-pointer" />}
      </div>
    </header>
  );
}
