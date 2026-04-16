import { useMemo, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import type { TimelineEvent } from '../types';

const STORAGE_KEY = 'notification_last_read';

function getLastRead(): number {
  const val = localStorage.getItem(STORAGE_KEY);
  return val ? parseInt(val, 10) : 0;
}

export function useNotifications() {
  const timeline      = useAppStore(s => s.timeline);
  const users         = useAppStore(s => s.users);
  const projects      = useAppStore(s => s.projects);
  const currentUser   = useAuthStore(s => s.currentUser);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const lastRead = getLastRead();
    return timeline
      .filter(
        (e) =>
          e.actorId !== currentUser.id &&
          new Date(e.createdAt).getTime() > lastRead,
      )
      .map((e) => toNotification(e, users, projects));
  }, [timeline, currentUser, users, projects]);

  const unreadCount = notifications.length;

  const markAllRead = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  return { notifications, unreadCount, markAllRead };
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
