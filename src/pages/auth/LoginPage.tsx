import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FolderKanban, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuthStore, type CurrentUser } from '../../store/useAuthStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('refreshToken', data.refreshToken);
      setAuth(data.accessToken, data.user as CurrentUser);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || err.response?.data?.error || '로그인에 실패했습니다.';
        setError(msg);
      } else {
        setError('로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg mb-4">
            <FolderKanban size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">ProjectHub</h1>
          <p className="text-xs text-zinc-500 mt-1">팀 협업 &amp; 프로젝트 관리 플랫폼</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-base font-bold text-zinc-800 mb-6">로그인</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">이메일</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="input pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 hover:text-zinc-600"
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : '로그인'}
            </button>
          </form>

          <p className="text-xs text-center text-zinc-400 mt-6">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-zinc-900 font-semibold hover:underline">회원가입</Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-zinc-400 mt-6">
          © 2026 CMWorld. All rights reserved.
        </p>
      </div>
    </div>
  );
}
