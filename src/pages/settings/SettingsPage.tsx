import { useState, useRef, useCallback } from 'react';
import {
  User, Bell, Shield, Camera, Check, X, Eye, EyeOff,
  Mail, Smartphone, Globe, ChevronRight,
} from 'lucide-react';
import { Header }    from '../../components/layout/Header';
import { Avatar }    from '../../components/ui/Avatar';
import { useAuthStore }             from '../../store/useAuthStore';
import { useNotificationSettings }  from '../../hooks/useNotificationSettings';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

type Section = 'profile' | 'notifications' | 'security';

const SECTIONS: { id: Section; icon: React.ElementType; label: string; desc: string }[] = [
  { id: 'profile',       icon: User,   label: '프로필',  desc: '이름, 이메일, 프로필 사진' },
  { id: 'notifications', icon: Bell,   label: '알림',    desc: '인앱·이메일·브라우저 알림 설정' },
  { id: 'security',      icon: Shield, label: '보안',    desc: '비밀번호 변경' },
];

// ── Toggle ─────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0',
        value ? 'bg-primary-500' : 'bg-slate-200',
      )}
    >
      <span className={cn(
        'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
        value ? 'translate-x-[22px]' : 'translate-x-[3px]',
      )} />
    </button>
  );
}

// ── ProfileSection ─────────────────────────────────────────────
function ProfileSection() {
  const currentUser   = useAuthStore(s => s.currentUser);
  const updateProfile = useAuthStore(s => s.updateProfile);

  const [name,    setName]    = useState(currentUser?.name  ?? '');
  const [email,   setEmail]   = useState(currentUser?.email ?? '');
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  // avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading,     setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarSrc = avatarPreview ?? currentUser?.avatar ?? undefined;

  const onAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 로컬 미리보기
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // 서버 업로드
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/auth/me/avatar', formData);
      updateProfile({ avatar: res.data.avatar });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '업로드 실패';
      setError(msg);
      setAvatarPreview(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [updateProfile]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.patch('/auth/me', { name: name.trim(), email: email.trim() });
      updateProfile({ name: res.data.name, email: res.data.email });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '저장 실패';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 프로필 사진 */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">프로필 사진</h3>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={name || currentUser?.name || '?'} src={avatarSrc} size="lg" className="w-16 h-16 text-lg" />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
            <button
              className="btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Camera size={13} />
              {uploading ? '업로드 중...' : '사진 변경'}
            </button>
            <p className="text-[11px] text-slate-400">JPG, PNG, WebP · 최대 10MB</p>
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">기본 정보</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">이름 *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">이메일 *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100 flex items-center gap-1.5">
          <X size={12} /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          className="btn-primary disabled:opacity-50"
          onClick={save}
          disabled={saving || !name.trim()}
        >
          {saving ? '저장 중...' : '변경사항 저장'}
        </button>
        {success && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check size={13} /> 저장되었습니다
          </span>
        )}
      </div>
    </div>
  );
}

// ── SecuritySection ────────────────────────────────────────────
function SecuritySection() {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState('');

  async function save() {
    setError('');
    if (next.length < 8)        { setError('새 비밀번호는 8자 이상이어야 합니다.'); return; }
    if (next !== confirm)        { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    setSaving(true);
    try {
      await api.post('/auth/me/password', { currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '변경 실패';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  function PwInput({
    label, value, show, onChange, onToggle, placeholder,
  }: {
    label: string; value: string; show: boolean;
    onChange: (v: string) => void;
    onToggle: () => void;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className="input pr-9"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={onToggle}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-sm">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">비밀번호 변경</h3>

      <PwInput
        label="현재 비밀번호"
        value={current}
        show={showCur}
        onChange={setCurrent}
        onToggle={() => setShowCur(v => !v)}
      />
      <PwInput
        label="새 비밀번호"
        value={next}
        show={showNew}
        onChange={setNext}
        onToggle={() => setShowNew(v => !v)}
        placeholder="8자 이상"
      />
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">새 비밀번호 확인</label>
        <input
          type="password"
          className={cn('input', confirm && next !== confirm && 'border-red-300 focus:ring-red-200')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {confirm && next !== confirm && (
          <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 border border-red-100 flex items-center gap-1.5">
          <X size={12} /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          className="btn-primary disabled:opacity-50"
          onClick={save}
          disabled={saving || !current || !next || next !== confirm}
        >
          {saving ? '변경 중...' : '비밀번호 변경'}
        </button>
        {success && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <Check size={13} /> 변경되었습니다
          </span>
        )}
      </div>
    </div>
  );
}

// ── NotificationsSection ───────────────────────────────────────
function NotificationsSection() {
  const { settings, update, togglePush } = useNotificationSettings();

  function Row({
    label, desc, checked, onToggle, indent,
  }: {
    label: string; desc: string; checked: boolean; onToggle: () => void; indent?: boolean;
  }) {
    return (
      <div className={cn(
        'flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100',
        indent && 'ml-4',
      )}>
        <div className="min-w-0 mr-3">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
        </div>
        <Toggle value={checked} onChange={onToggle} />
      </div>
    );
  }

  function GroupLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
      <div className="flex items-center gap-2 mt-6 mb-2 first:mt-0">
        <Icon size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
    );
  }

  const pushGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

  return (
    <div className="space-y-2">
      {/* 인앱 알림 */}
      <GroupLabel icon={Bell} label="인앱 알림 (알림 벨)" />
      <Row label="업무 할당" desc="나에게 업무가 할당될 때"
        checked={settings.inapp_taskAssigned}
        onToggle={() => update('inapp_taskAssigned', !settings.inapp_taskAssigned)} />
      <Row label="업무 수정" desc="담당 업무가 변경될 때"
        checked={settings.inapp_taskUpdated}
        onToggle={() => update('inapp_taskUpdated', !settings.inapp_taskUpdated)} />
      <Row label="업무 완료" desc="담당 업무가 완료 처리될 때"
        checked={settings.inapp_taskCompleted}
        onToggle={() => update('inapp_taskCompleted', !settings.inapp_taskCompleted)} />
      <Row label="파일 업로드" desc="프로젝트에 파일이 업로드될 때"
        checked={settings.inapp_fileUploaded}
        onToggle={() => update('inapp_fileUploaded', !settings.inapp_fileUploaded)} />
      <Row label="공지사항" desc="새 공지사항이 등록될 때"
        checked={settings.inapp_announcment}
        onToggle={() => update('inapp_announcment', !settings.inapp_announcment)} />
      <Row label="멤버 참여" desc="새 멤버가 프로젝트에 참여할 때"
        checked={settings.inapp_memberJoined}
        onToggle={() => update('inapp_memberJoined', !settings.inapp_memberJoined)} />

      {/* 이메일 알림 */}
      <GroupLabel icon={Mail} label="이메일 알림" />
      <Row label="업무 할당 이메일" desc="나에게 업무가 할당될 때 이메일 수신"
        checked={settings.email_taskAssigned}
        onToggle={() => update('email_taskAssigned', !settings.email_taskAssigned)} />
      <Row label="마감 임박 리마인더" desc="마감 24시간 전 이메일 수신"
        checked={settings.email_dueDateReminder}
        onToggle={() => update('email_dueDateReminder', !settings.email_dueDateReminder)} />
      <Row label="주간 리포트" desc="매주 월요일 프로젝트 요약 이메일"
        checked={settings.email_weeklyDigest}
        onToggle={() => update('email_weeklyDigest', !settings.email_weeklyDigest)} />

      {/* 브라우저 푸시 */}
      <GroupLabel icon={Smartphone} label="브라우저 푸시" />
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
        <div className="min-w-0 mr-3">
          <p className="text-sm font-medium text-slate-700">브라우저 푸시 알림</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {settings.push_enabled && pushGranted
              ? '브라우저 푸시 알림이 활성화되어 있습니다.'
              : '브라우저가 닫혀있어도 알림을 받을 수 있습니다.'}
          </p>
          {settings.push_enabled && !pushGranted && (
            <p className="text-xs text-amber-500 mt-1">브라우저 권한이 필요합니다. 주소창 자물쇠 아이콘에서 허용해 주세요.</p>
          )}
        </div>
        <Toggle value={settings.push_enabled} onChange={togglePush} />
      </div>
    </div>
  );
}

// ── SettingsPage ───────────────────────────────────────────────
export function SettingsPage() {
  const [section, setSection] = useState<Section>('profile');
  const current = SECTIONS.find((s) => s.id === section)!;

  function renderContent() {
    switch (section) {
      case 'profile':       return <ProfileSection />;
      case 'notifications': return <NotificationsSection />;
      case 'security':      return <SecuritySection />;
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
