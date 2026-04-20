import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Columns3, GanttChartSquare,
  BookOpen, Clock, Paperclip, Settings, ChevronDown, Plus,
  Megaphone, BarChart2, Vote, Shield, ClipboardList, Zap, Mail,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useMemo } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard',      icon: LayoutDashboard, label: '대시보드' },
  { to: '/my-tasks',       icon: ClipboardList,   label: '내 업무' },
  { to: '/projects',       icon: FolderKanban,    label: '프로젝트' },
  { to: '/kanban',         icon: Columns3,        label: '칸반 보드' },
  { to: '/gantt',          icon: GanttChartSquare,label: '간트차트' },
  { to: '/wiki',           icon: BookOpen,        label: '위키' },
  { to: '/announcements',  icon: Megaphone,       label: '공지사항' },
  { to: '/timeline',       icon: Clock,           label: '타임라인' },
  { to: '/files',          icon: Paperclip,       label: '파일 보관함' },
  { to: '/resources',      icon: BarChart2,       label: '자원 관리' },
  { to: '/polls',          icon: Vote,            label: '투표' },
  { to: '/mail',           icon: Mail,            label: '메일' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const projectsMap = useAppStore(s => s.projects);
  const currentUser = useAuthStore(s => s.currentUser);
  const projects = useMemo(
    () => Object.values(projectsMap)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4),
    [projectsMap],
  );

  return (
    <aside className="w-60 shrink-0 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-700 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
            <Zap size={16} className="text-white dark:text-zinc-900" fill="currentColor" />
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">ProjectHub</span>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">스마트 협업 플랫폼</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}

        {/* Recent Projects */}
        <div className="pt-3">
          <button
            className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            onClick={() => setProjectsOpen((o) => !o)}
          >
            <span>최근 프로젝트</span>
            <ChevronDown
              size={11}
              className={cn('transition-transform duration-200', !projectsOpen && '-rotate-90')}
            />
          </button>
          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {projects.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors',
                    location.pathname === `/projects/${p.id}` && 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 w-full transition-colors"
                onClick={() => navigate('/projects')}
              >
                <Plus size={12} />
                <span>새 프로젝트</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className="px-3 py-3 border-t border-zinc-100 dark:border-zinc-700 space-y-0.5">
          {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn('sidebar-item', isActive && 'active')
              }
            >
              <Shield size={15} />
              <span>회원 관리</span>
            </NavLink>
          )}
          <NavLink
            to="/settings"
            className={cn('sidebar-item justify-between', location.pathname === '/settings' && 'active')}
          >
            <div className="flex items-center gap-2.5">
              <Avatar name={currentUser.name} size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate" title={currentUser.email}>{currentUser.email}</p>
              </div>
            </div>
            <Settings size={13} className="flex-shrink-0 opacity-40" />
          </NavLink>
        </div>
      )}
    </aside>
  );
}
