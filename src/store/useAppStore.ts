import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import api from '../lib/api';
import {
  type AppState,
  type Project,
  type Task,
  type Tag,
  type WorkflowStatus,
  type WikiPage,
  type Announcement,
  type FileItem,
  type TimelineEvent,
  type Poll,
} from '../types';

// ── Actions interface ──────────────────────────────────────────
interface AppActions {
  // Init
  initialize: () => Promise<void>;
  loadProjectData: (projectId: string) => Promise<void>;
  setUsers: (users: Record<string, { id: string; name: string; email: string; role: string }>) => void;

  // Project
  createProject:    (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'members' | 'workflow' | 'tags'>) => Promise<string>;
  updateProject:    (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProject:    (id: string) => Promise<void>;
  addProjectMember: (projectId: string, userId: string, role: 'admin' | 'member' | 'viewer') => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;

  // Workflow (per-project)
  setWorkflow:       (projectId: string, workflow: WorkflowStatus[]) => Promise<void>;

  // Tag (per-project)
  createTag: (projectId: string, name: string, color: string) => Promise<string>;
  updateTag: (projectId: string, tagId: string, patch: Partial<Omit<Tag, 'id'>>) => Promise<void>;
  deleteTag: (projectId: string, tagId: string) => Promise<void>;

  // Task
  createTask:   (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours' | 'order'>) => Promise<string>;
  updateTask:   (id: string, patch: Partial<Omit<Task, 'id' | 'projectId' | 'createdAt'>>) => Promise<void>;
  deleteTask:   (id: string) => Promise<void>;
  moveTask:     (taskId: string, toStatusId: string, toIndex: number) => Promise<void>;
  reorderTask:  (projectId: string, statusId: string, fromIndex: number, toIndex: number) => void;
  addDependency:    (taskId: string, blockerId: string) => Promise<void>;
  removeDependency: (taskId: string, blockerId: string) => Promise<void>;
  addWorkLog:    (data: { taskId: string; userId: string; hours: number; note: string; date: string }) => Promise<void>;
  deleteWorkLog: (id: string) => Promise<void>;

  // Wiki
  createWikiPage: (data: Omit<WikiPage, 'id'>) => Promise<string>;
  updateWikiPage: (id: string, patch: Partial<Omit<WikiPage, 'id' | 'projectId'>>) => Promise<void>;
  deleteWikiPage: (id: string) => Promise<void>;

  // Announcement
  createAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => Promise<string>;
  updateAnnouncement: (id: string, patch: Partial<Omit<Announcement, 'id' | 'projectId' | 'createdAt'>>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePinAnnouncement: (id: string) => Promise<void>;

  // File
  uploadFiles:  (projectId: string, files: FileList) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

  // Poll
  createPoll:  (data: Omit<Poll, 'id' | 'createdAt'>) => Promise<string>;
  updatePoll:  (id: string, patch: Partial<Pick<Poll, 'title' | 'description'>>) => Promise<void>;
  deletePoll:  (id: string) => Promise<void>;
  castVote:    (pollId: string, optionId: string) => Promise<void>;
  retractVote: (pollId: string, optionId: string) => Promise<void>;
  closePoll:   (id: string) => Promise<void>;

  // Timeline
  loadTimeline: (projectId: string) => Promise<void>;

  // UI
  setSelectedProject: (id: string | null) => void;
}

// ── Selectors ─────────────────────────────────────────────────
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
    users:            {},
    projects:         {},
    tasks:            {},
    wikiPages:        {},
    announcements:    {},
    workLogs:         {},
    timeline:         [],
    files:            {},
    polls:            {},
    selectedProjectId: null,

    // ── Init ─────────────────────────────────────────────────
    async initialize() {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);

      const projects: Project[] = projectsRes.data;
      const users = usersRes.data;

      set((s) => {
        s.users = Object.fromEntries(users.map((u: { id: string }) => [u.id, u]));
        s.projects = Object.fromEntries(projects.map((p) => [p.id, p]));
      });

      if (projects.length > 0) {
        const firstId = get().selectedProjectId ?? projects[0].id;
        const exists  = projects.find((p) => p.id === firstId);
        const projectId = exists ? firstId : projects[0].id;
        set((s) => { s.selectedProjectId = projectId; });
        // Load ALL projects' full data in parallel
        await Promise.all(
          projects.map((p) => get().loadProjectData(p.id).catch(() => {})),
        );
      }
    },

    async loadProjectData(projectId: string) {
      if (!projectId) return;
      const [tasksRes, wikiRes, annoRes, filesRes, pollsRes] = await Promise.all([
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/wiki`),
        api.get(`/projects/${projectId}/announcements`),
        api.get(`/projects/${projectId}/files`),
        api.get(`/projects/${projectId}/polls`),
      ]);
      set((s) => {
        for (const t of tasksRes.data) s.tasks[t.id] = t;
        for (const w of wikiRes.data) s.wikiPages[w.id] = w;
        for (const a of annoRes.data) s.announcements[a.id] = a;
        for (const f of filesRes.data) s.files[f.id] = f;
        for (const p of pollsRes.data) s.polls[p.id] = p;
      });
      await get().loadTimeline(projectId);
    },

    setUsers(users) {
      set((s) => { s.users = users as typeof s.users; });
    },

    // ── Project ──────────────────────────────────────────────
    async createProject(data) {
      const res = await api.post('/projects', {
        name: data.name, description: data.description,
        color: data.color, startDate: data.startDate, endDate: data.endDate,
      });
      const project: Project = res.data;
      set((s) => { s.projects[project.id] = project; });
      await get().loadTimeline(project.id);
      return project.id;
    },

    async updateProject(id, patch) {
      const res = await api.patch(`/projects/${id}`, {
        name: patch.name, description: patch.description,
        color: patch.color, startDate: patch.startDate, endDate: patch.endDate,
      });
      set((s) => { s.projects[id] = res.data; });
    },

    async deleteProject(id) {
      await api.delete(`/projects/${id}`);
      set((s) => {
        delete s.projects[id];
        for (const tid of Object.keys(s.tasks)) {
          if (s.tasks[tid].projectId === id) delete s.tasks[tid];
        }
      });
    },

    async addProjectMember(projectId, userId, role) {
      await api.post(`/projects/${projectId}/members`, { userId, role });
      const res = await api.get(`/projects/${projectId}`);
      set((s) => { s.projects[projectId] = res.data; });
    },

    async removeProjectMember(projectId, userId) {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      set((s) => {
        const p = s.projects[projectId];
        if (p) p.members = p.members.filter((m) => m.id !== userId);
      });
    },

    // ── Workflow ─────────────────────────────────────────────
    async setWorkflow(projectId, workflow) {
      await api.put(`/projects/${projectId}/workflow`, { workflow });
      set((s) => {
        if (s.projects[projectId]) s.projects[projectId].workflow = workflow;
      });
    },

    // ── Tags ─────────────────────────────────────────────────
    async createTag(projectId, name, color) {
      const res = await api.post(`/projects/${projectId}/tags`, { name, color });
      const tag: Tag = res.data;
      set((s) => { s.projects[projectId]?.tags.push(tag); });
      return tag.id;
    },

    async updateTag(projectId, tagId, patch) {
      await api.patch(`/projects/${projectId}/tags/${tagId}`, patch);
      set((s) => {
        const tags = s.projects[projectId]?.tags;
        if (!tags) return;
        const idx = tags.findIndex((t) => t.id === tagId);
        if (idx !== -1) Object.assign(tags[idx], patch);
      });
    },

    async deleteTag(projectId, tagId) {
      await api.delete(`/projects/${projectId}/tags/${tagId}`);
      set((s) => {
        const p = s.projects[projectId];
        if (!p) return;
        p.tags = p.tags.filter((t) => t.id !== tagId);
        for (const task of Object.values(s.tasks)) {
          if (task.projectId === projectId)
            task.tagIds = task.tagIds.filter((id) => id !== tagId);
        }
      });
    },

    // ── Task ─────────────────────────────────────────────────
    async createTask(data) {
      const res = await api.post(`/projects/${data.projectId}/tasks`, {
        title: data.title, description: data.description,
        statusId: data.statusId, priority: data.priority,
        assigneeIds: data.assigneeIds, tagIds: data.tagIds,
        blockedBy: data.blockedBy, startDate: data.startDate,
        dueDate: data.dueDate, estimatedHours: data.estimatedHours,
        parentId: data.parentId,
      });
      const task: Task = res.data;
      set((s) => { s.tasks[task.id] = task; });
      get().loadTimeline(data.projectId).catch(console.error);
      return task.id;
    },

    async updateTask(id, patch) {
      const res = await api.patch(`/tasks/${id}`, patch);
      set((s) => { s.tasks[id] = res.data; });
      // refresh timeline
      const task = get().tasks[id];
      if (task) await get().loadTimeline(task.projectId);
    },

    async deleteTask(id) {
      const task = get().tasks[id];
      if (!task) return;
      await api.delete(`/tasks/${id}`);
      set((s) => {
        delete s.tasks[id];
        for (const t of Object.values(s.tasks)) {
          t.blockedBy = t.blockedBy.filter((bid) => bid !== id);
        }
      });
      await get().loadTimeline(task.projectId);
    },

    async moveTask(taskId, toStatusId, toIndex) {
      const task = get().tasks[taskId];
      if (!task) return;
      // optimistic update
      set((s) => {
        const t = s.tasks[taskId];
        if (!t) return;
        t.statusId = toStatusId;
        t.updatedAt = new Date().toISOString();
      });
      await api.post(`/projects/${task.projectId}/tasks/move`, { taskId, toStatusId, toIndex });
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

    async addDependency(taskId, blockerId) {
      const task = get().tasks[taskId];
      if (!task) return;
      await api.patch(`/tasks/${taskId}`, {
        blockedBy: [...task.blockedBy, blockerId],
      });
      set((s) => {
        const t = s.tasks[taskId];
        if (!t || t.blockedBy.includes(blockerId)) return;
        t.blockedBy.push(blockerId);
      });
    },

    async removeDependency(taskId, blockerId) {
      const task = get().tasks[taskId];
      if (!task) return;
      await api.patch(`/tasks/${taskId}`, {
        blockedBy: task.blockedBy.filter((id) => id !== blockerId),
      });
      set((s) => {
        const t = s.tasks[taskId];
        if (!t) return;
        t.blockedBy = t.blockedBy.filter((id) => id !== blockerId);
      });
    },

    async addWorkLog(data) {
      // Optimistic local update only — server work_logs endpoint TBD
      const id = `wl-${Date.now()}`;
      const createdAt = new Date().toISOString();
      set((s) => {
        s.workLogs[id] = { ...data, id, createdAt };
        const task = s.tasks[data.taskId];
        if (task) task.loggedHours = parseFloat((task.loggedHours + data.hours).toFixed(1));
      });
    },

    async deleteWorkLog(id) {
      set((s) => {
        const wl = s.workLogs[id];
        if (!wl) return;
        delete s.workLogs[id];
        const task = s.tasks[wl.taskId];
        if (task) task.loggedHours = parseFloat(Math.max(0, task.loggedHours - wl.hours).toFixed(1));
      });
    },

    // ── Wiki ─────────────────────────────────────────────────
    async createWikiPage(data) {
      const res = await api.post(`/projects/${data.projectId}/wiki`, {
        title: data.title, content: data.content,
      });
      const page: WikiPage = res.data;
      set((s) => { s.wikiPages[page.id] = page; });
      return page.id;
    },

    async updateWikiPage(id, patch) {
      const res = await api.patch(`/wiki/${id}`, patch);
      set((s) => { if (s.wikiPages[id]) Object.assign(s.wikiPages[id], res.data); });
    },

    async deleteWikiPage(id) {
      await api.delete(`/wiki/${id}`);
      set((s) => { delete s.wikiPages[id]; });
    },

    // ── Announcement ─────────────────────────────────────────
    async createAnnouncement(data) {
      const res = await api.post(`/projects/${data.projectId}/announcements`, {
        title: data.title, content: data.content, isPinned: data.isPinned,
      });
      const ann: Announcement = res.data;
      set((s) => { s.announcements[ann.id] = ann; });
      get().loadTimeline(data.projectId).catch(console.error);
      return ann.id;
    },

    async updateAnnouncement(id, patch) {
      const res = await api.patch(`/announcements/${id}`, patch);
      set((s) => { if (s.announcements[id]) Object.assign(s.announcements[id], res.data); });
    },

    async deleteAnnouncement(id) {
      await api.delete(`/announcements/${id}`);
      set((s) => { delete s.announcements[id]; });
    },

    async togglePinAnnouncement(id) {
      const ann = get().announcements[id];
      if (!ann) return;
      const res = await api.patch(`/announcements/${id}`, { isPinned: !ann.isPinned });
      set((s) => { if (s.announcements[id]) Object.assign(s.announcements[id], res.data); });
    },

    // ── File ─────────────────────────────────────────────────
    async uploadFiles(projectId, files) {
      const formData = new FormData();
      for (const f of Array.from(files)) formData.append('files', f);
      const res = await api.post(`/projects/${projectId}/files`, formData);
      const uploaded: FileItem[] = res.data;
      set((s) => { for (const f of uploaded) s.files[f.id] = f; });
      await get().loadTimeline(projectId);
    },

    async deleteFile(id) {
      await api.delete(`/files/${id}`);
      set((s) => { delete s.files[id]; });
    },

    // ── Poll ────────────────────────────────────────────────
    async createPoll(data) {
      const res = await api.post(`/projects/${data.projectId}/polls`, {
        title: data.title, description: data.description,
        options: data.options.map((o) => o.label),
        isMultiple: data.isMultiple,
        showResultsBeforeClose: data.showResultsBeforeClose,
        dueDate: data.dueDate,
      });
      const poll: Poll = res.data;
      set((s) => { s.polls[poll.id] = poll; });
      return poll.id;
    },

    async updatePoll(id, patch) {
      const res = await api.patch(`/polls/${id}`, patch);
      set((s) => { if (s.polls[id]) s.polls[id] = res.data; });
    },

    async deletePoll(id) {
      await api.delete(`/polls/${id}`);
      set((s) => { delete s.polls[id]; });
    },

    async castVote(pollId, optionId) {
      const res = await api.post(`/polls/${pollId}/vote`, { optionId });
      set((s) => { if (s.polls[pollId]) s.polls[pollId] = res.data; });
    },

    async retractVote(pollId, optionId) {
      const res = await api.delete(`/polls/${pollId}/vote`, { data: { optionId } });
      set((s) => { if (s.polls[pollId]) s.polls[pollId] = res.data; });
    },

    async closePoll(id) {
      const res = await api.patch(`/polls/${id}`, { status: 'closed' });
      set((s) => { if (s.polls[id]) s.polls[id] = res.data; });
    },

    // ── Timeline ─────────────────────────────────────────────
    async loadTimeline(projectId) {
      if (!projectId) return;
      const res = await api.get(`/projects/${projectId}/timeline`);
      const events: TimelineEvent[] = res.data;
      set((s) => {
        // merge: keep events from other projects, replace for this project
        const others = s.timeline.filter((e) => e.projectId !== projectId);
        s.timeline = [...events, ...others];
      });
    },

    // ── UI ───────────────────────────────────────────────────
    setSelectedProject(id) {
      set((s) => { s.selectedProjectId = id; });
      if (id) get().loadProjectData(id);
    },

  })),
);

// ── Derived selectors ──────────────────────────────────────────
export function getProjectProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.statusId.endsWith('-done') || t.statusId === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
