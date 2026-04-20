import { Navigate } from 'react-router-dom';
import { useAuthStore, type GlobalRole } from '../../store/useAuthStore';

interface Props {
  children: React.ReactNode;
  requiredRoles?: GlobalRole[];
}

export function ProtectedRoute({ children, requiredRoles }: Props) {
  const currentUser = useAuthStore(s => s.currentUser);

  if (!currentUser) return <Navigate to="/login" replace />;

  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="card p-8 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏳</span>
          </div>
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 mb-2">승인 대기 중</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            관리자가 계정을 검토 중입니다.<br />승인 후 로그인하실 수 있습니다.
          </p>
          <button
            className="mt-4 text-xs text-zinc-900 dark:text-zinc-100 hover:underline"
            onClick={() => {
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
