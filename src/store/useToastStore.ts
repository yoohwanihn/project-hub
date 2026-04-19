import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  add: (type: ToastType, message: string, duration?: number) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (type, message, duration = 3500) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string, dur?: number) => useToastStore.getState().add('success', msg, dur),
  error:   (msg: string, dur?: number) => useToastStore.getState().add('error',   msg, dur),
  info:    (msg: string, dur?: number) => useToastStore.getState().add('info',    msg, dur),
  warning: (msg: string, dur?: number) => useToastStore.getState().add('warning', msg, dur),
};
