import { Bell, Search, HelpCircle } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { CURRENT_USER } from '../../data/mock';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
      {/* Title */}
      <div className="min-w-0">
        <h1 className="text-sm font-bold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-52">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="검색..."
            className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full text-slate-700"
          />
        </div>

        {actions}

        {/* Notification */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Help */}
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <HelpCircle size={16} />
        </button>

        {/* Avatar */}
        <Avatar name={CURRENT_USER.name} size="sm" className="cursor-pointer" />
      </div>
    </header>
  );
}
