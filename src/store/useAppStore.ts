import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from './nanoid';
import {
  type AppState,
  type Project,
  type Task,
  type Tag,
  type WorkflowStatus,
  type WikiPage,
  type Announcement,
  type FileItem,
  type WorkLog,
  type TimelineEvent,
  type Poll,
} from '../types';
import {
  MOCK_USERS,
  MOCK_PROJECTS_RAW,
  MOCK_TASKS_RAW,
  MOCK_WIKI_PAGES_RAW,
  MOCK_ANNOUNCEMENTS_RAW,
  MOCK_WORK_LOGS_RAW,
  MOCK_TIMELINE_RAW,
  MOCK_FILES_RAW,
  MOCK_POLLS_RAW,
} from '../data/seed';

// ── Actions interface ──────────────────────────────────────────
interface AppActions {
  // Project
  createProject:    (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProject:    (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject:    (id: string) => void;
  addProjectMember: (projectId: string, userId: string, role: 'admin' | 'member' | 'viewer') => void;
  removeProjectMember: (projectId: string, userId: string) => void;

  // Workflow (per-project)
  setWorkflow:       (projectId: string, workflow: WorkflowStatus[]) => void;
  addWorkflowStatus: (projectId: string, status: WorkflowStatus) => void;
  updateWorkflowStatus: (projectId: string, statusId: string, patch: Partial<WorkflowStatus>) => void;
  deleteWorkflowStatus: (projectId: string, statusId: string, migrateToId: string) => void;

  // Tag (per-project)
  createTag: (projectId: string, name: string, color: string) => string;
  updateTag: (projectId: string, tagId: string, patch: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (projectId: string, tagId: string) => void;

  // Task
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours' | 'order'>) => string;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  moveTask:   (taskId: string, toStatusId: string, toIndex: number) => void;
  reorderTask:(projectId: string, statusId: string, fromIndex: number, toIndex: number) => void;

  // Dependencies
  addDependency:    (taskId: string, blockerId: string) => void;
  removeDependency: (taskId: string, blockerId: string) => void;

  // Wiki
  createWikiPage: (data: Omit<WikiPage, 'id'>) => string;
  updateWikiPage: (id: string, patch: Partial<Omit<WikiPage, 'id' | 'projectId'>>) => void;
  deleteWikiPage: (id: string) => void;

  // Announcement
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => string;
  updateAnnouncement: (id: string, patch: Partial<Omit<Announcement, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteAnnouncement: (id: string) => void;
  togglePinAnnouncement: (id: string) => void;

  // File
  addFile:    (data: Omit<FileItem, 'id' | 'createdAt'>) => string;
  deleteFile: (id: string) => void;

  // Poll
  createPoll:   (data: Omit<Poll, 'id' | 'createdAt'>) => string;
  updatePoll:   (id: string, patch: Partial<Pick<Poll, 'title' | 'description'>>) => void;
  deletePoll:   (id: string) => void;
  castVote:     (pollId: string, optionId: string, userId: string) => void;
  retractVote:  (pollId: string, optionId: string, userId: string) => void;
  closePoll:    (id: string) => void;

  // WorkLog
  addWorkLog:    (data: Omit<WorkLog, 'id' | 'createdAt'>) => string;
  deleteWorkLog: (id: string) => void;

  // UI
  setSelectedProject: (id: string | null) => void;

  // Timeline helper
  _addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt'>) => void;
}

// ── Selectors (exported for use in components) ─────────────────
export const selectors = {
  project: (id: string) => (s: AppState) => s.projects[id],
  projectTasks: (projectId: string) => (s: AppState) =>
    Object.values(s.tasks).filter((t) => t.projectId === projectId),
  tasksByStatus: (projectId: string, statusId: string) => (s: AppState) =>
    Object.values(s.tasks)
      .filter((t) => t.projectId === projectId && t.statusId === statusId)
      .sort((a, b) => a.order - b.order),
  user: (id: string) => (s: AppState) => s.users[id],
  projectList: (s: AppState) => Object.values(s.projects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  ),
  pollsByProject: (projectId: string) => (s: AppState) =>
    Object.values(s.polls).filter((p) => p.projectId === projectId),
};

// ── Store ──────────────────────────────────────────────────────
export const useAppStore = create<AppState & AppActions>()(
  immer((set, get) => ({
    // ── Initial state ────────────────────────────────────────
    users:         Object.fromEntries(MOCK_USERS.map((u) => [u.id, u])),
    projects:      Object.fromEntries(MOCK_PROJECTS_RAW.map((p) => [p.id, p])),
    tasks:         Object.fromEntries(MOCK_TASKS_RAW.map((t) => [t.id, t])),
    wikiPages:     Object.fromEntries(MOCK_WIKI_PAGES_RAW.map((w) => [w.id, w])),
    announcements: Object.fromEntries(MOCK_ANNOUNCEMENTS_RAW.map((a) => [a.id, a])),
    workLogs:      Object.fromEntries(MOCK_WORK_LOGS_RAW.map((w) => [w.id, w])),
    timeline:      MOCK_TIMELINE_RAW,
    files:         Object.fromEntries(MOCK_FILES_RAW.map((f) => [f.id, f])),
    polls:         Object.fromEntries(MOCK_POLLS_RAW.map((p) => [p.id, p])),
    currentUserId: 'u1',
    selectedProjectId: 'p1',

    // ── Project ──────────────────────────────────────────────
    createProject(data) {
      const id = nanoid();
      const now = new Date().toISOString();
      set((s) => {
        s.projects[id] = { ...data, id, createdAt: now, updatedAt: now };
      });
      get()._addEvent({ type: 'project_created', actorId: get().currentUserId, projectId: id, payload: { projectName: data.name } });
      return id;
    },

    updateProject(id, patch) {
      set((s) => {
        if (!s.projects[id]) return;
        Object.assign(s.projects[id], patch, { updatedAt: new Date().toISOString() });
      });
    },

    deleteProject(id) {
      set((s) => {
        delete s.projects[id];
        // cascade delete tasks
        for (const tid of Object.keys(s.tasks)) {
          if (s.tasks[tid].projectId === id) delete s.tasks[tid];
        }
      });
    },

    addProjectMember(projectId, userId, role) {
      const user = get().users[userId];
      if (!user) return;
      set((s) => {
        const p = s.projects[projectId];
        if (!p) return;
        if (p.members.find((m) => m.id === userId)) return;
        p.members.push({ ...user, role });
        p.updatedAt = new Date().toISOString();
      });
    },

    removeProjectMember(projectId, userId) {
      set((s) => {
        const p = s.projects[projectId];
        if (!p) return;
        p.members = p.members.filter((m) => m.id !== userId);
        p.updatedAt = new Date().toISOString();
      });
    },

    // ── Workflow ─────────────────────────────────────────────
    setWorkflow(projectId, workflow) {
      set((s) => {
        if (!s.projects[projectId]) return;
        s.projects[projectId].workflow = workflow;
        s.projects[projectId].updatedAt = new Date().toISOString();
      });
    },

    addWorkflowStatus(projectId, status) {
      set((s) => {
        s.projects[projectId]?.workflow.push(status);
      });
    },

    updateWorkflowStatus(projectId, statusId, patch) {
      set((s) => {
        const wf = s.projects[projectId]?.workflow;
        if (!wf) return;
        const idx = wf.findIndex((w) => w.id === statusId);
        if (idx !== -1) Object.assign(wf[idx], patch);
      });
    },

    deleteWorkflowStatus(projectId, statusId, migrateToId) {
      set((s) => {
        const p = s.projects[projectId];
        if (!p) return;
        p.workflow = p.workflow.filter((w) => w.id !== statusId);
        // migrate tasks
        for (const t of Object.values(s.tasks)) {
          if (t.projectId === projectId && t.statusId === statusId) {
            t.statusId = migrateToId;
          }
        }
      });
    },

    // ── Tags ─────────────────────────────────────────────────
    createTag(projectId, name, color) {
      const id = nanoid();
      set((s) => {
        s.projects[projectId]?.tags.push({ id, name, color });
      });
      return id;
    },

    updateTag(projectId, tagId, patch) {
      set((s) => {
        const tags = s.projects[projectId]?.tags;
        if (!tags) return;
        const idx = tags.findIndex((t) => t.id === tagId);
        if (idx !== -1) Object.assign(tags[idx], patch);
      });
    },

    deleteTag(projectId, tagId) {
      set((s) => {
        const p = s.projects[projectId];
        if (!p) return;
        p.tags = p.tags.filter((t) => t.id !== tagId);
        // remove from tasks
        for (const task of Object.values(s.tasks)) {
          if (task.projectId === projectId) {
            task.tagIds = task.tagIds.filter((id) => id !== tagId);
          }
        }
      });
    },

    // ── Task ─────────────────────────────────────────────────
    createTask(data) {
      const id = nanoid();
      const now = new Date().toISOString();
      // compute max order in column
      const colTasks = Object.values(get().tasks).filter(
        (t) => t.projectId === data.projectId && t.statusId === data.statusId,
      );
      const order = colTasks.length ? Math.max(...colTasks.map((t) => t.order)) + 1 : 0;
      set((s) => {
        s.tasks[id] = {
          ...data,
          id,
          loggedHours: 0,
          order,
          blockedBy: data.blockedBy ?? [],
          createdAt: now,
          updatedAt: now,
        };
        // bump project updatedAt
        if (s.projects[data.projectId]) {
          s.projects[data.projectId].updatedAt = now;
        }
      });
      get()._addEvent({
        type: 'task_created',
        actorId: get().currentUserId,
        projectId: data.projectId,
        payload: { taskId: id, taskTitle: data.title },
      });
      return id;
    },

    updateTask(id, patch) {
      const prev = get().tasks[id];
      if (!prev) return;
      const now = new Date().toISOString();
      set((s) => {
        Object.assign(s.tasks[id], patch, { updatedAt: now });
      });
      // emit timeline event
      if (patch.statusId && patch.statusId !== prev.statusId) {
        get()._addEvent({
          type: patch.statusId === 'done' ? 'task_completed' : 'task_updated',
          actorId: get().currentUserId,
          projectId: prev.projectId,
          payload: {
            taskId: id,
            taskTitle: prev.title,
            field: 'status',
            from: prev.statusId,
            to: patch.statusId,
          },
        });
      }
    },

    deleteTask(id) {
      const task = get().tasks[id];
      if (!task) return;
      set((s) => {
        delete s.tasks[id];
        // clean up references in other tasks
        for (const t of Object.values(s.tasks)) {
          t.blockedBy = t.blockedBy.filter((bid) => bid !== id);
        }
      });
      get()._addEvent({
        type: 'task_deleted',
        actorId: get().currentUserId,
        projectId: task.projectId,
        payload: { taskId: id, taskTitle: task.title },
      });
    },

    moveTask(taskId, toStatusId, toIndex) {
      set((s) => {
        const task = s.tasks[taskId];
        if (!task) return;
        task.statusId = toStatusId;
        task.updatedAt = new Date().toISOString();

        // re-order destination column
        const col = Object.values(s.tasks)
          .filter((t) => t.projectId === task.projectId && t.statusId === toStatusId && t.id !== taskId)
          .sort((a, b) => a.order - b.order);

        col.splice(toIndex, 0, task);
        col.forEach((t, i) => { s.tasks[t.id].order = i; });
      });
    },

    reorderTask(projectId, statusId, fromIndex, toIndex) {
      set((s) => {
        const col = Object.values(s.tasks)
          .filter((t) => t.projectId === projectId && t.statusId === statusId)
          .sort((a, b) => a.order - b.order);

        const [moved] = col.splice(fromIndex, 1);
        col.splice(toIndex, 0, moved);
        col.forEach((t, i) => { s.tasks[t.id].order = i; });
      });
    },

    // ── Dependencies ─────────────────────────────────────────
    addDependency(taskId, blockerId) {
      set((s) => {
        const t = s.tasks[taskId];
        if (!t || t.blockedBy.includes(blockerId)) return;
        t.blockedBy.push(blockerId);
        t.updatedAt = new Date().toISOString();
      });
    },

    removeDependency(taskId, blockerId) {
      set((s) => {
        const t = s.tasks[taskId];
        if (!t) return;
        t.blockedBy = t.blockedBy.filter((id) => id !== blockerId);
        t.updatedAt = new Date().toISOString();
      });
    },

    // ── Wiki ─────────────────────────────────────────────────
    createWikiPage(data) {
      const id = nanoid();
      set((s) => { s.wikiPages[id] = { ...data, id }; });
      return id;
    },

    updateWikiPage(id, patch) {
      set((s) => {
        if (!s.wikiPages[id]) return;
        Object.assign(s.wikiPages[id], patch, { updatedAt: new Date().toISOString() });
      });
    },

    deleteWikiPage(id) {
      set((s) => { delete s.wikiPages[id]; });
    },

    // ── Announcement ─────────────────────────────────────────
    createAnnouncement(data) {
      const id = nanoid();
      const createdAt = new Date().toISOString();
      set((s) => { s.announcements[id] = { ...data, id, createdAt }; });
      return id;
    },

    updateAnnouncement(id, patch) {
      set((s) => {
        if (!s.announcements[id]) return;
        Object.assign(s.announcements[id], patch);
      });
    },

    deleteAnnouncement(id) {
      set((s) => { delete s.announcements[id]; });
    },

    togglePinAnnouncement(id) {
      set((s) => {
        if (!s.announcements[id]) return;
        s.announcements[id].isPinned = !s.announcements[id].isPinned;
      });
    },

    // ── File ─────────────────────────────────────────────────
    addFile(data) {
      const id = nanoid();
      const createdAt = new Date().toISOString();
      set((s) => { s.files[id] = { ...data, id, createdAt }; });
      get()._addEvent({
        type: 'file_uploaded',
        actorId: get().currentUserId,
        projectId: data.projectId,
        payload: { fileName: data.name },
      });
      return id;
    },

    deleteFile(id) {
      set((s) => { delete s.files[id]; });
    },

    // ── Poll ────────────────────────────────────────────────────
    createPoll(data) {
      const id = nanoid();
      const now = new Date().toISOString();
      set((s) => {
        s.polls[id] = { ...data, id, createdAt: now };
      });
      return id;
    },

    updatePoll(id, patch) {
      set((s) => {
        if (!s.polls[id]) return;
        Object.assign(s.polls[id], patch);
      });
    },

    deletePoll(id) {
      set((s) => { delete s.polls[id]; });
    },

    castVote(pollId, optionId, userId) {
      set((s) => {
        const poll = s.polls[pollId];
        if (!poll || poll.status === 'closed') return;
        if (!poll.isMultiple) {
          for (const opt of poll.options) {
            opt.voterIds = opt.voterIds.filter((uid) => uid !== userId);
          }
        }
        const opt = poll.options.find((o) => o.id === optionId);
        if (opt && !opt.voterIds.includes(userId)) {
          opt.voterIds.push(userId);
        }
      });
    },

    retractVote(pollId, optionId, userId) {
      set((s) => {
        const poll = s.polls[pollId];
        if (!poll || poll.status === 'closed') return;
        const opt = poll.options.find((o) => o.id === optionId);
        if (opt) {
          opt.voterIds = opt.voterIds.filter((uid) => uid !== userId);
        }
      });
    },

    closePoll(id) {
      set((s) => {
        const poll = s.polls[id];
        if (!poll || poll.status === 'closed') return;
        poll.status = 'closed';
      });
    },

    // ── WorkLog ───────────────────────────────────────────────
    addWorkLog(data) {
      const id = nanoid();
      const createdAt = new Date().toISOString();
      set((s) => {
        s.workLogs[id] = { ...data, id, createdAt };
        // update task.loggedHours
        const task = s.tasks[data.taskId];
        if (task) task.loggedHours = parseFloat((task.loggedHours + data.hours).toFixed(1));
      });
      return id;
    },

    deleteWorkLog(id) {
      set((s) => {
        const wl = s.workLogs[id];
        if (!wl) return;
        delete s.workLogs[id];
        // subtract from task.loggedHours
        const task = s.tasks[wl.taskId];
        if (task) task.loggedHours = parseFloat(Math.max(0, task.loggedHours - wl.hours).toFixed(1));
      });
    },

    // ── UI ───────────────────────────────────────────────────
    setSelectedProject(id) {
      set((s) => { s.selectedProjectId = id; });
    },

    // ── Internal ─────────────────────────────────────────────
    _addEvent(event) {
      const id = nanoid();
      const createdAt = new Date().toISOString();
      set((s) => {
        s.timeline.unshift({ ...event, id, createdAt });
        if (s.timeline.length > 200) s.timeline.length = 200;
      });
    },
  })),
);

// ── Derived selectors (computed outside store) ─────────────────
export function getProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.statusId === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
