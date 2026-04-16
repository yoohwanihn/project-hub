import { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, ChevronRight } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';

type Section = 'profile' | 'notifications' | 'security' | 'appearance' | 'language';

const SECTIONS: { id: Section; icon: React.ElementType; label: string; desc: string }[] = [
  { id: 'profile',       icon: User,    label: '프로필',    desc: '이름, 이메일, 아바타 설정' },
  { id: 'notifications', icon: Bell,    label: '알림',      desc: '알림 방식 및 수신 설정' },
  { id: 'security',      icon: Shield,  label: '보안',      desc: '비밀번호, 2단계 인증' },
  { id: 'appearance',    icon: Palette, label: '테마',      desc: '다크모드, 색상 설정' },
  { id: 'language',      icon: Globe,   label: '언어/지역', desc: '언어, 날짜 형식 설정' },
];

function ProfileSection() {
  const currentUser = useAuthStore(s => s.currentUser);
  const [name, setName]   = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4">프로필 사진</h3>
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="space-y-1.5">
            <button className="btn-secondary text-xs">사진 변경</button>
            <p className="text-xs text-slate-400">JPG, PNG 최대 2MB</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">이름</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">이메일</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">직책</label>
          <input className="input" placeholder="예: 프론트엔드 개발자" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">부서</label>
          <input className="input" placeholder="예: 개발팀" />
        </div>
      </div>

      <div className="pt-2">
        <button className="btn-primary">변경사항 저장</button>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [settings, setSettings] = useState({
    taskAssigned:    true,
    taskCompleted:   true,
    commentAdded:    true,
    dueDateReminder: true,
    projectUpdates:  false,
    weeklyDigest:    true,
  });

  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'taskAssigned',    label: '업무 할당',      desc: '나에게 업무가 할당될 때' },
    { key: 'taskCompleted',   label: '업무 완료',      desc: '담당 업무가 완료될 때' },
    { key: 'commentAdded',    label: '댓글 알림',      desc: '내 업무에 댓글이 달릴 때' },
    { key: 'dueDateReminder', label: '마감 임박 알림', desc: '마감 24시간 전 알림' },
    { key: 'projectUpdates',  label: '프로젝트 업데이트', desc: '프로젝트 변경 사항' },
    { key: 'weeklyDigest',    label: '주간 리포트',    desc: '매주 월요일 주간 요약' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </div>
          <button
            className={cn(
              'w-10 h-5.5 rounded-full transition-colors relative',
              settings[key] ? 'bg-primary-500' : 'bg-slate-200',
            )}
            onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}
          >
            <span
              className={cn(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                settings[key] ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
}

function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Shield size={20} />
      </div>
      <p className="text-sm font-semibold text-slate-600">{label} 설정</p>
      <p className="text-xs text-slate-400 mt-1">이 기능은 곧 제공될 예정입니다.</p>
    </div>
  );
}

export function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const current = SECTIONS.find((s) => s.id === section)!;

  function renderContent() {
    switch (section) {
      case 'profile':       return <ProfileSection />;
      case 'notifications': return <NotificationsSection />;
      default:              return <PlaceholderSection label={current.label} />;
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="설정" />

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        {/* Nav */}
        <div className="w-56 shrink-0">
          <div className="card overflow-hidden">
            {SECTIONS.map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                className={cn(
                  'w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-slate-50 last:border-0',
                  section === id ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-50 text-slate-600',
                )}
                onClick={() => setSection(id)}
              >
                <Icon size={15} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                </div>
                <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">{current.label}</h2>
            <p className="text-xs text-slate-400 mb-6">{current.desc}</p>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
