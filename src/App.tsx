import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage }         from './pages/auth/LoginPage';
import { RegisterPage }      from './pages/auth/RegisterPage';
import { AdminPage }         from './pages/admin/AdminPage';
import { DashboardPage }     from './pages/dashboard/DashboardPage';
import { ProjectsPage }      from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { KanbanPage }        from './pages/kanban/KanbanPage';
import { GanttPage }         from './pages/gantt/GanttPage';
import { WikiPage }          from './pages/wiki/WikiPage';
import { TimelinePage }      from './pages/timeline/TimelinePage';
import { FilesPage }         from './pages/files/FilesPage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { ResourcesPage }     from './pages/resources/ResourcesPage';
import { PollsPage }         from './pages/polls/PollsPage';
import { SettingsPage }      from './pages/settings/SettingsPage';
import { MyTasksPage }      from './pages/mytasks/MyTasksPage';

function AppRoutes() {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<DashboardPage />} />
        <Route path="/projects"      element={<ProjectsPage />} />
        <Route path="/projects/:id"  element={<ProjectDetailPage />} />
        <Route path="/kanban"        element={<KanbanPage />} />
        <Route path="/gantt"         element={<GanttPage />} />
        <Route path="/wiki"          element={<WikiPage />} />
        <Route path="/timeline"      element={<TimelinePage />} />
        <Route path="/files"         element={<FilesPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/resources"     element={<ResourcesPage />} />
        <Route path="/polls"         element={<PollsPage />} />
        <Route path="/my-tasks"      element={<MyTasksPage />} />
        <Route path="/settings"      element={<SettingsPage />} />
        <Route path="/admin" element={
          <ProtectedRoute requiredRoles={['owner', 'admin']}>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
