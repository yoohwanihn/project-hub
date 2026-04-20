import { create } from 'zustand';

interface UIState {
  selectedProjectId:  string | null;
  setSelectedProject: (id: string | null) => void;
  isDark:      boolean;
  toggleTheme: () => void;
}

function getInitialDark(): boolean {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return true; // 다크모드 기본값
}

export const useUIStore = create<UIState>()((set) => ({
  selectedProjectId:  null,
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  isDark: getInitialDark(),
  toggleTheme: () => set((s) => {
    const next = !s.isDark;
    localStorage.setItem('theme', next ? 'dark' : 'light');
    return { isDark: next };
  }),
}));
