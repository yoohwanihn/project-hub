import { create } from 'zustand';

export type GlobalRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface CurrentUser {
  id:     string;
  name:   string;
  email:  string;
  role:   GlobalRole;
  status: string;
}

interface AuthState {
  accessToken:  string | null;
  currentUser:  CurrentUser | null;
  setAuth:      (token: string, user: CurrentUser) => void;
  updateToken:  (token: string) => void;
  clearAuth:    () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken:  null,
  currentUser:  null,
  setAuth:      (token, user) => set({ accessToken: token, currentUser: user }),
  updateToken:  (token) => set({ accessToken: token }),
  clearAuth:    () => set({ accessToken: null, currentUser: null }),
}));
