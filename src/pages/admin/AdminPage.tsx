import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

type UserStatus = 'pending' | 'active' | 'rejected';
type GlobalRole = 'owner' | 'admin' | 'member' | 'viewer';

interface AdminUser {
  id: string; name: string; email: string; role: GlobalRole; status: UserStatus;
}

type FilterTab = 'all' | UserStatus;

const STATUS_LABEL: Record<UserStatus, string> = { pending: '승인 대기', active: '활성', rejected: '거절됨' };
const STATUS_CLASS: Record<UserStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-600',
  active: 'bg-zinc-900 text-white',
  rejected: 'bg-red-100 text-red-600',
};

export function AdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<FilterTab>('all');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users').then(r => r.data),
  });

  const approve   = useMutation({ mutationFn: (id: string) => api.patch(`/admin/users/${id}/approve`),   onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
  const reject    = useMutation({ mutationFn: (id: string) => api.patch(`/admin/users/${id}/reject`),    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }) });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: GlobalRole }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const filtered     = tab === 'all' ? users : users.filter(u => u.status === tab);
  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="회원 관리" subtitle="가입 승인 및 역할 관리" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-1 mb-6 border-b border-zinc-200">
          {([
            ['all', '전체', users.length],
            ['pending', '승인 대기', pendingCount],
            ['active', '활성', users.filter(u => u.status === 'active').length],
            ['rejected', '거절됨', users.filter(u => u.status === 'rejected').length],
          ] as [FilterTab, string, number][]).map(([id, label, count]) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                tab === id ? 'border-zinc-800 dark:border-zinc-200 text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200')}>
              {label}
              <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                id === 'pending' && count > 0 ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-400')}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 text-sm">로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 text-sm">유저가 없습니다.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">유저</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">역할</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{user.name}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge text-xs', STATUS_CLASS[user.status])}>
                        {STATUS_LABEL[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={user.role}
                        onChange={(e) => changeRole.mutate({ id: user.id, role: e.target.value as GlobalRole })}
                        className="input py-1 text-xs w-24">
                        <option value="owner">소유자</option>
                        <option value="admin">관리자</option>
                        <option value="member">멤버</option>
                        <option value="viewer">뷰어</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {user.status === 'pending' && (<>
                          <button onClick={() => approve.mutate(user.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            <CheckCircle2 size={12} /> 승인
                          </button>
                          <button onClick={() => reject.mutate(user.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <XCircle size={12} /> 거절
                          </button>
                        </>)}
                        {user.status === 'active' && (
                          <button onClick={() => { if (window.confirm(`${user.name}의 계정을 비활성화하시겠습니까?`)) reject.mutate(user.id); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
                            <XCircle size={12} /> 비활성화
                          </button>
                        )}
                        {user.status === 'rejected' && (
                          <button onClick={() => approve.mutate(user.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            <CheckCircle2 size={12} /> 재승인
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
