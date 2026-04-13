import { useState } from 'react';
import { Plus, Clock, ChevronRight, BookOpen, History } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { useAppStore } from '../../store/useAppStore';
import { formatDate, timeAgo } from '../../lib/utils';
import type { WikiPage } from '../../types';

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-slate-800 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-100">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-slate-900 mb-3">$1</h1>')
    .replace(/```(\w*)\n([\s\S]*?)```/gm, '<pre class="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-x-auto my-3 font-mono"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-primary-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-slate-700 mb-1">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
    .replace(/\n\n/g, '<br/><br/>');
}

export function WikiPage() {
  const wikiPages = useAppStore((s) => Object.values(s.wikiPages).filter((w) => w.projectId === 'p1'));
  const users     = useAppStore((s) => s.users);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const page = selectedPage ?? wikiPages[0];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="위키"
        subtitle="프로젝트 지식 베이스"
        actions={
          <button className="btn-primary">
            <Plus size={14} /> 새 페이지
          </button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">페이지 목록</p>
            <div className="space-y-0.5">
              {wikiPages.map((wp) => (
                <button
                  key={wp.id}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    page?.id === wp.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedPage(wp)}
                >
                  <BookOpen size={13} className="flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{wp.title}</span>
                  <ChevronRight size={10} className="ml-auto flex-shrink-0 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {!page ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">페이지를 선택하세요.</div>
          ) : (
          <div className="max-w-3xl mx-auto px-8 py-8">
            {/* Page header */}
            <div className="mb-6 pb-5 border-b border-slate-100">
              <h1 className="text-xl font-bold text-slate-900 mb-3">{page.title}</h1>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  {users[page.authorId] && <Avatar name={users[page.authorId].name} size="xs" />}
                  <span>{users[page.authorId]?.name ?? '알 수 없음'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  <span>{timeAgo(page.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <History size={11} />
                  <span>v{page.version}</span>
                </div>
                <span className="text-slate-300">|</span>
                <span>{formatDate(page.updatedAt, 'yyyy.MM.dd HH:mm')}</span>
              </div>
            </div>

            {/* Markdown content */}
            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
            />

            {/* Edit footer */}
            <div className="mt-10 pt-5 border-t border-slate-100 flex gap-2">
              <button className="btn-primary">편집</button>
              <button className="btn-secondary">버전 기록</button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
