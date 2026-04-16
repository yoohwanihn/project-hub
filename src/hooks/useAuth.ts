import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore, type CurrentUser } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

export function useAuth() {
  const [initializing, setInitializing] = useState(true);
  const setAuth      = useAuthStore(s => s.setAuth);
  const clearAuth    = useAuthStore(s => s.clearAuth);
  const accessToken  = useAuthStore(s => s.accessToken);
  const initialize   = useAppStore(s => s.initialize);

  useEffect(() => {
    async function restore() {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { setInitializing(false); return; }

      try {
        const { data: refreshData } = await axios.post('/api/auth/refresh', { refreshToken });
        const token: string = refreshData.accessToken;

        const { data: user } = await axios.get<CurrentUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAuth(token, user);
      } catch {
        clearAuth();
        localStorage.removeItem('refreshToken');
      } finally {
        setInitializing(false);
      }
    }
    restore();
  }, [setAuth, clearAuth]);

  // 로그인 완료 후 앱 데이터 초기화
  useEffect(() => {
    if (accessToken) {
      initialize().catch(console.error);
    }
  }, [accessToken, initialize]);

  return { initializing };
}
