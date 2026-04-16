import { useMemo, useCallback, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import type { TimelineEvent } from '../types';

const LAST_READ_KEY   = 'notification_last_read';
const DISMISSED_KEY   = 'notification_dismissed';

function getLastRead(): number {
  const val = localStorage.getItem(LAST_READ_KEY);
  return val ? parseInt(val, 10) : 0;
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function useNotifications() {
  const timeline    = useAppStore(s => s.timeline);
  const users       = useAppStore(s => s.users);
  const projects    = useAppStore(s => s.projects);
  const currentUser = useAuthStore(s => s.currentUser);

  // React state so that dismiss triggers re-render
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const lastRead = getLastRead();
    return timeline
      .filter(
        (e) =>
          e.actorId !== currentUser.id &&
          new Date(e.createdAt).getTime() > lastRead &&
          !dismissed.has(e.id),
      )
      .map((e) => toNotification(e, users, projects));
  }, [timeline, currentUser, users, projects, dismissed]);

  const unreadCount = notifications.length;

  // 개별 삭제
  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }, []);

  // 전체 삭제
  const dismissAll = useCallback(() => {
    const ids = new Set(
      timeline
        .filter((e) => currentUser && e.actorId !== currentUser.id)
        .map((e) => e.id),
    );
    saveDismissed(ids);
    setDismissed(ids);
    localStorage.setItem(LAST_READ_KEY, Date.now().toString());
  }, [timeline, currentUser]);

  // 패널 열 때 읽음 처리 (빨간 점 제거용, 삭제와는 별개)
  const markAllRead = useCallback(() => {
    localStorage.setItem(LAST_READ_KEY, Date.now().toString());
  }, []);

  return { notifications, unreadCount, dismissOne, dismissAll, markAllRead };
}

// ── helpers ───────────────────────────────────────────────────────

function toNotification(
  event: TimelineEvent,
  users: Record<string, { name: string }>,
  projects: Record<string, { name: string }>,
) {
  const actorName   = users[event.actorId]?.name ?? '누군가';
  const projectName = projects[event.projectId]?.name ?? '프로젝트';
  const payload     = event.payload as Record<string, string>;

  let message = '';
  switch (event.type) {
    case 'task_created':
      message = `${actorName}님이 "${payload.taskTitle ?? '작업'}"을 등록했습니다.`;
      break;
    case 'task_updated':
      message = `${actorName}님이 "${payload.taskTitle ?? '작업'}"을 수정했습니다.`;
      break;
    case 'task_completed':
      message = `${actorName}님이 "${payload.taskTitle ?? '작업'}"을 완료했습니다.`;
      break;
    case 'task_deleted':
      message = `${actorName}님이 작업을 삭제했습니다.`;
      break;
    case 'file_uploaded':
      message = `${actorName}님이 "${payload.fileName ?? '파일'}"을 업로드했습니다.`;
      break;
    case 'project_created':
      message = `${actorName}님이 프로젝트 "${projectName}"을 생성했습니다.`;
      break;
    case 'announcement_created':
      message = `${actorName}님이 공지 "${payload.title ?? ''}"을 등록했습니다.`;
      break;
    case 'wiki_created':
      message = `${actorName}님이 위키 "${payload.title ?? ''}"를 작성했습니다.`;
      break;
    case 'poll_created':
      message = `${actorName}님이 투표 "${payload.title ?? ''}"를 생성했습니다.`;
      break;
    case 'member_joined':
      message = `새 멤버가 ${projectName}에 합류했습니다.`;
      break;
    default:
      message = `${actorName}님이 ${projectName}에서 활동했습니다.`;
  }

  return {
    id:          event.id,
    type:        event.type,
    actorId:     event.actorId,
    actorName,
    projectId:   event.projectId,
    projectName,
    message,
    createdAt:   event.createdAt,
  };
}
