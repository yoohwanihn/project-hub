import { useAuthStore, type GlobalRole } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';

const GLOBAL_FULL: GlobalRole[] = ['owner', 'admin'];

export function usePermission(projectId?: string) {
  const currentUser = useAuthStore(s => s.currentUser);
  const projects    = useAppStore(s => s.projects);

  const role = currentUser?.role ?? 'viewer';
  const isGlobalAdmin = GLOBAL_FULL.includes(role);

  const project = projectId ? projects[projectId] : undefined;
  const projectMember = project?.members.find(m => m.id === currentUser?.id);
  const projectRole = projectMember?.role ?? null;
  const isProjectAdmin  = isGlobalAdmin || projectRole === 'owner' || projectRole === 'admin';
  const isProjectMember = isProjectAdmin || projectRole === 'member';

  return {
    canCreateProject:  isGlobalAdmin,
    canManageUsers:    isGlobalAdmin,
    canEditProject:    isProjectAdmin,
    canDeleteProject:  isProjectAdmin,
    canManageMembers:  isProjectAdmin,
    canCreateTask:     isProjectMember,
    canEditTask:       isProjectMember,
    canDeleteTask:     isProjectMember,
    canCreateContent:  isProjectMember,
    canDeleteContent:  isProjectAdmin,
    canVote:           !!projectMember || isGlobalAdmin,
    isGlobalAdmin,
    isProjectAdmin,
    isProjectMember,
    projectRole,
    globalRole: role,
  };
}
