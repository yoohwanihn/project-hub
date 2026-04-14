import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { KanbanPage } from './pages/kanban/KanbanPage';
import { GanttPage } from './pages/gantt/GanttPage';
import { WikiPage } from './pages/wiki/WikiPage';
import { TimelinePage } from './pages/timeline/TimelinePage';
import { FilesPage } from './pages/files/FilesPage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { ResourcesPage } from './pages/resources/ResourcesPage';
import { PollsPage } from './pages/polls/PollsPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/projects"     element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/kanban"       element={<KanbanPage />} />
          <Route path="/gantt"        element={<GanttPage />} />
          <Route path="/wiki"         element={<WikiPage />} />
          <Route path="/timeline"     element={<TimelinePage />} />
          <Route path="/files"          element={<FilesPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/resources"     element={<ResourcesPage />} />
          <Route path="/polls"         element={<PollsPage />} />
          <Route path="/settings"      element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
