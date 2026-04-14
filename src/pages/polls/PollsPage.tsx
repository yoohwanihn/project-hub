import { useState } from 'react';
import { Plus, Vote } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { useAppStore } from '../../store/useAppStore';
import { PollCard } from './PollCard';
import { PollCreateModal } from './PollCreateModal';
import type { Poll } from '../../types';

type Tab = 'active' | 'closed';

export function PollsPage() {
  const { polls, projects, currentUserId, selectedProjectId, createPoll, setSelectedProject } =
    useAppStore((s) => ({
      polls:              s.polls,
      projects:           s.projects,
      currentUserId:      s.currentUserId,
      selectedProjectId:  s.selectedProjectId,
      createPoll:         s.createPoll,
      setSelectedProject: s.setSelectedProject,
    }));

  const projectList = Object.values(projects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  // 전역 selectedProjectId를 직접 사용 (fallback: 최신 프로젝트)
  const viewProjectId = selectedProjectId ?? projectList[0]?.id ?? '';

  const [tab, setTab]           = useState<Tab>('active');
  const [showCreate, setShowCreate] = useState(false);

  const allPolls = Object.values(polls)
    .filter((p) => p.projectId === viewProjectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered: Poll[] = allPolls.filter((p) =>
    tab === 'active' ? p.status === 'active' : p.status === 'closed',
  );

  const activeCount = allPolls.filter((p) => p.status === 'active').length;
  const closedCount = allPolls.filter((p) => p.status === 'closed').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="투표"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="input py-1.5 text-xs"
              value={viewProjectId}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              className="btn-primary gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} /> 투표 만들기
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* 탭 */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {([
            ['active', '진행 중', activeCount],
            ['closed', '종료된 투표', closedCount],
          ] as [Tab, string, number][]).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Vote size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {tab === 'active' ? '진행 중인 투표가 없습니다' : '종료된 투표가 없습니다'}
            </p>
            {tab === 'active' && (
              <button
                className="mt-3 btn-primary text-xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={13} className="mr-1" /> 첫 투표 만들기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        )}
      </div>

      <PollCreateModal
        open={showCreate}
        projectId={viewProjectId}
        authorId={currentUserId}
        onClose={() => setShowCreate(false)}
        onSubmit={(data) => createPoll(data)}
      />
    </div>
  );
}
