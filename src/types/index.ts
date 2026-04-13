// ────────────────────────────────────────────────────────────────
// Domain Types
// ────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority   = 'low' | 'medium' | 'high' | 'urgent';
export type Role       = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  progress: number;
  startDate: string;
  endDate: string;
  members: User[];
  taskCounts: { todo: number; in_progress: number; review: number; done: number };
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignees: User[];
  tags: Tag[];
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  order: number;
  subtasks?: Task[];
  parentId?: string;
  blockedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  content: string;
  version: number;
  author: User;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  projectId: string;
  title: string;
  content: string;
  author: User;
  isPinned: boolean;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'comment_added' | 'member_joined' | 'file_uploaded';
  actor: User;
  payload: Record<string, unknown>;
  projectId: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: User;
  createdAt: string;
}
