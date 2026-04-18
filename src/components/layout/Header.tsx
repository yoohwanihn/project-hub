import { useState, useRef, useEffect } from 'react';
import { Bell, Search, HelpCircle, LogOut, UserX, User, ChevronDown, X, Trash2 } from 'lucide-react';
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

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
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
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
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
    <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-sm font-bold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-52">
            <Search size={13} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="검색..."
              className="text-xs bg-transparent outline-none placeholder:text-slate-400 w-full text-slate-700"
            />
          </div>
        )}

        {actions}

        {/* 알림 버튼 */}
        <div ref={bellRef} className="relative">
          <button
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={handleBellOpen}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {/* 헤더 */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-700">알림</p>
                  {notifications.length > 0 && (
                    <span className="text-[11px] bg-primary-100 text-primary-600 font-semibold px-1.5 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    title="전체 삭제"
                  >
                    <Trash2 size={11} />
                    전체 삭제
                  </button>
                )}
              </div>

              {/* 목록 */}
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">새 알림이 없습니다.</p>
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <li key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors group/item">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary-600">
                            {n.actorName.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{n.projectName}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">
                            {formatDate(n.createdAt, 'MM/dd HH:mm')}
                          </p>
                        </div>
                        {/* 개별 삭제 버튼 */}
                        <button
                          onClick={() => dismissOne(n.id)}
                          className="flex-shrink-0 p-0.5 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover/item:opacity-100 transition-all mt-0.5"
                          title="알림 삭제"
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

        {/* 도움말 */}
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <HelpCircle size={16} />
        </button>

        {/* 유저 메뉴 */}
        {currentUser && (
          <div ref={userMenuRef} className="relative">
            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {/* 유저 정보 */}
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* 메뉴 아이템 */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                  >
                    <User size={14} className="text-slate-400" />
                    프로필 설정
                  </button>

                  <hr className="my-1 border-slate-100" />

                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  >
                    <LogOut size={14} className="text-slate-400" />
                    로그아웃
                  </button>

                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => { setUserMenuOpen(false); handleWithdraw(); }}
                    disabled={withdrawing}
                  >
                    <UserX size={14} />
                    {withdrawing ? '처리 중...' : '회원 탈퇴'}
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
