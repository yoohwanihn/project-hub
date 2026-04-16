import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Columns3, GanttChartSquare,
  BookOpen, Clock, Paperclip, Settings, ChevronDown, Plus, Megaphone, BarChart2, Vote, Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useMemo } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/projects',  icon: FolderKanban,    label: '프로젝트' },
  { to: '/kanban',    icon: Columns3,        label: '칸반 보드' },
  { to: '/gantt',     icon: GanttChartSquare,label: '간트차트' },
  { to: '/wiki',          icon: BookOpen,   label: '위키' },
  { to: '/announcements', icon: Megaphone,  label: '공지사항' },
  { to: '/timeline',      icon: Clock,      label: '타임라인' },
  { to: '/files',         icon: Paperclip,  label: '파일 보관함' },
  { to: '/resources',     icon: BarChart2,  label: '자원 관리' },
  { to: '/polls',         icon: Vote,       label: '투표' },
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
      .slice(0, 3),
    [projectsMap],
  );

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
            className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
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
              className={cn('transition-transform', !projectsOpen && '-rotate-90')}
            />
          </button>
          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {projects.map((p) => (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 font-medium hover:bg-slate-50 transition-colors',
                    location.pathname === `/projects/${p.id}` && 'bg-slate-50 text-slate-900',
                  )}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
              <button
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-primary-600 font-medium hover:bg-primary-50 w-full"
                onClick={() => navigate('/projects')}
              >
                <Plus size={12} /> 새 프로젝트
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
          {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800')
              }
            >
              <Shield size={16} />
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
                <p className="text-xs font-semibold text-slate-700 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <Settings size={14} className="text-slate-400 flex-shrink-0" />
          </NavLink>
        </div>
      )}
    </aside>
  );
}
