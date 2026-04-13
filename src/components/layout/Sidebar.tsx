import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Columns3, GanttChartSquare,
  BookOpen, Clock, Paperclip, Settings, ChevronDown, Plus,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { CURRENT_USER, MOCK_PROJECTS } from '../../data/mock';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard,  label: '대시보드' },
  { to: '/projects',   icon: FolderKanban,      label: '프로젝트' },
  { to: '/kanban',     icon: Columns3,          label: '칸반 보드' },
  { to: '/gantt',      icon: GanttChartSquare,  label: '간트차트' },
  { to: '/wiki',       icon: BookOpen,          label: '위키' },
  { to: '/timeline',   icon: Clock,             label: '타임라인' },
  { to: '/files',      icon: Paperclip,         label: '파일 보관함' },
];

export function Sidebar() {
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(true);

  return (
    <aside className="w-60 shrink-0 h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <FolderKanban size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">ProjectHub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('sidebar-item', isActive && 'active')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Recent Projects */}
        <div className="pt-4">
          <button
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600"
            onClick={() => setProjectsOpen((o) => !o)}
          >
            <span>최근 프로젝트</span>
            <ChevronDown
              size={12}
              className={cn('transition-transform', projectsOpen ? 'rotate-0' : '-rotate-90')}
            />
          </button>
          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {MOCK_PROJECTS.slice(0, 3).map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 font-medium cursor-pointer transition-colors hover:bg-slate-50',
                    location.pathname === `/projects/${p.id}` && 'bg-slate-50 text-slate-900',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
              <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-primary-600 font-medium hover:bg-primary-50 w-full">
                <Plus size={12} />
                새 프로젝트
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-slate-100">
        <NavLink
          to="/settings"
          className={cn('sidebar-item justify-between', location.pathname === '/settings' && 'active')}
        >
          <div className="flex items-center gap-2.5">
            <Avatar name={CURRENT_USER.name} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{CURRENT_USER.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{CURRENT_USER.email}</p>
            </div>
          </div>
          <Settings size={14} className="text-slate-400 flex-shrink-0" />
        </NavLink>
      </div>
    </aside>
  );
}
