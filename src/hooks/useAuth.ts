import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore, type CurrentUser } from '../store/useAuthStore';

export function useAuth() {
  const [initializing, setInitializing] = useState(true);
  const setAuth   = useAuthStore(s => s.setAuth);
  const clearAuth = useAuthStore(s => s.clearAuth);

  useEffect(() => {
    async function restore() {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { setInitializing(false); return; }

      try {
        const { data: refreshData } = await axios.post('/api/auth/refresh', { refreshToken });
        const accessToken: string = refreshData.accessToken;

        const { data: user } = await axios.get<CurrentUser>('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setAuth(accessToken, user);
      } catch {
        clearAuth();
        localStorage.removeItem('refreshToken');
      } finally {
        setInitializing(false);
      }
    }
    restore();
  }, [setAuth, clearAuth]);

  return { initializing };
}
