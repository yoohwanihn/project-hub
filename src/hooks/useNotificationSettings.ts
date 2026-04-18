import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export interface NotificationSettings {
  // 인앱 알림 (bell)
  inapp_taskAssigned:    boolean;
  inapp_taskUpdated:     boolean;
  inapp_taskCompleted:   boolean;
  inapp_fileUploaded:    boolean;
  inapp_announcment:     boolean;
  inapp_memberJoined:    boolean;
  // 이메일 알림
  email_dueDateReminder: boolean;
  email_weeklyDigest:    boolean;
  email_taskAssigned:    boolean;
  // 브라우저 푸시
  push_enabled:          boolean;
}

const DEFAULT: NotificationSettings = {
  inapp_taskAssigned:    true,
  inapp_taskUpdated:     true,
  inapp_taskCompleted:   true,
  inapp_fileUploaded:    true,
  inapp_announcment:     true,
  inapp_memberJoined:    true,
  email_dueDateReminder: false,
  email_weeklyDigest:    false,
  email_taskAssigned:    false,
  push_enabled:          false,
};

function storageKey(userId: string) {
  return `notif_settings_${userId}`;
}

function load(userId: string): NotificationSettings {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function useNotificationSettings() {
  const currentUser = useAuthStore(s => s.currentUser);
  const userId = currentUser?.id ?? '';

  const [settings, setSettings] = useState<NotificationSettings>(() =>
    userId ? load(userId) : { ...DEFAULT },
  );

  const update = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(next));
      return next;
    });
  }, [userId]);

  const requestPush = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }, []);

  const togglePush = useCallback(async () => {
    if (!settings.push_enabled) {
      const granted = await requestPush();
      if (granted) update('push_enabled', true);
    } else {
      update('push_enabled', false);
    }
  }, [settings.push_enabled, requestPush, update]);

  return { settings, update, togglePush };
}
