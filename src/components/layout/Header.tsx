import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, UserX, User, ChevronDown, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
}

export function Header({ title, subtitle, actions, showSearch = false }: HeaderProps) {
  const currentUser  = useAuthStore(s => s.currentUser);
  const clearAuth    = useAuthStore(s => s.clearAuth);
  const navigate     = useNavigate();

  const { notifications, unreadCount, dismissOne, dismissAll, markAllRead } = useNotifications();

  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [bellOpen,     setBellOpen]       = useState(false);
  const [withdrawing,  setWithdrawing]    = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const bellRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleBellOpen() {
    setBellOpen((v) => !v);
    if (!bellOpen) markAllRead();
  }

  async function handleLogout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    localStorage.removeItem('refreshToken');
    clearAuth();
    navigate('/login');
  }

  async function handleWithdraw() {
    if (!confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    setWithdrawing(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.delete('/auth/me', { data: { refreshToken } });
      localStorage.removeItem('refreshToken');
      clearAuth();
      navigate('/login');
    } catch (e) {
      console.error(e);
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <header className="page-header">
      <div className="min-w-0">
        <h1 className="text-base font-bold text-zinc-900 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl w-52 mr-1">
            <Search size={13} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="검색..."
              className="text-xs bg-transparent outline-none placeholder:text-zinc-400 w-full text-zinc-700"
            />
          </div>
        )}

        {actions && <div className="flex items-center gap-2 mr-1">{actions}</div>}

        {/* 알림 버튼 */}
        <div ref={bellRef} className="relative">
          <button
            className="relative p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 transition-colors"
            onClick={handleBellOpen}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-zinc-100 rounded-2xl shadow-modal z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-zinc-800">알림</p>
                  {notifications.length > 0 && (
                    <span className="text-[11px] bg-zinc-100 text-zinc-600 font-semibold px-1.5 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={11} /> 전체 삭제
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">새 알림이 없습니다.</p>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-50">
                  {notifications.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-zinc-50 transition-colors group/item">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-zinc-600">
                            {n.actorName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-700 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{n.projectName}</p>
                          <p className="text-[10px] text-zinc-300 mt-0.5">{formatDate(n.createdAt, 'MM/dd HH:mm')}</p>
                        </div>
                        <button
                          onClick={() => dismissOne(n.id)}
                          className="flex-shrink-0 p-0.5 rounded text-zinc-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover/item:opacity-100 transition-all mt-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* 유저 메뉴 */}
        {currentUser && (
          <div ref={userMenuRef} className="relative">
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
              <ChevronDown size={11} className="text-zinc-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-zinc-100 rounded-2xl shadow-modal z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/60">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-1.5">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                  >
                    <User size={14} className="text-zinc-400" /> 프로필 설정
                  </button>

                  <hr className="my-1 border-zinc-100" />

                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  >
                    <LogOut size={14} className="text-zinc-400" /> 로그아웃
                  </button>

                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); handleWithdraw(); }}
                    disabled={withdrawing}
                  >
                    <UserX size={14} /> {withdrawing ? '처리 중...' : '회원 탈퇴'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
