// ────────────────────────────────────────────────────────────────
// Domain Types
// ────────────────────────────────────────────────────────────────

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Role     = 'owner' | 'admin' | 'member' | 'viewer';

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

// ── Workflow ───────────────────────────────────────────────────
// A project can have up to 8 custom status columns.
export interface WorkflowStatus {
  id: string;       // e.g. "todo", "in_progress", or a custom UUID
  label: string;    // display name
  color: string;    // hex color for the badge
  order: number;    // column order
}

export const DEFAULT_WORKFLOW: WorkflowStatus[] = [
  { id: 'todo',        label: '진행 전', color: '#94a3b8', order: 0 },
  { id: 'in_progress', label: '진행 중', color: '#3b82f6', order: 1 },
  { id: 'review',      label: '검토 중', color: '#f59e0b', order: 2 },
  { id: 'done',        label: '완료',    color: '#10b981', order: 3 },
];

// ── Project ────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  startDate: string;
  endDate: string;
  members: User[];
  workflow: WorkflowStatus[];   // project-specific workflow
  tags: Tag[];                  // project-level tag palette
  createdAt: string;
  updatedAt: string;
}

// ── Task ───────────────────────────────────────────────────────
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  statusId: string;             // references WorkflowStatus.id
  priority: Priority;
  assigneeIds: string[];        // references User.id
  tagIds: string[];             // references Tag.id
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours: number;
  order: number;                // within a column
  parentId?: string;            // for subtasks
  /** IDs of tasks this task depends on (must be completed first) */
  blockedBy: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Wiki ───────────────────────────────────────────────────────
export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  content: string;
  version: number;
  authorId: string;
  updatedAt: string;
}

// ── Announcement ───────────────────────────────────────────────
export interface Announcement {
  id: string;
  projectId: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  createdAt: string;
}

// ── Timeline ───────────────────────────────────────────────────
export type TimelineEventType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'comment_added'
  | 'member_joined'
  | 'file_uploaded'
  | 'project_created';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  actorId: string;
  payload: Record<string, unknown>;
  projectId: string;
  createdAt: string;
}

// ── WorkLog ────────────────────────────────────────────────────
export interface WorkLog {
  id: string;
  taskId: string;
  userId: string;
  hours: number;       // 0.5 단위
  note: string;
  date: string;        // YYYY-MM-DD
  createdAt: string;
}

// ── File ───────────────────────────────────────────────────────
export interface FileItem {
  id: string;
  projectId: string;
  name: string;
  size: number;
  mimeType: string;
  uploaderId: string;
  createdAt: string;
}

// ── Store helpers ──────────────────────────────────────────────
export interface AppState {
  // Entities
  users: Record<string, User>;
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  wikiPages: Record<string, WikiPage>;
  announcements: Record<string, Announcement>;
  workLogs: Record<string, WorkLog>;
  timeline: TimelineEvent[];
  files: Record<string, FileItem>;

  // UI state
  currentUserId: string;
  selectedProjectId: string | null;
}
