import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export function RegisterPage() {
  const navigate = useNavigate();

  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/register', { name, email, password });
      setDone(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || '회원가입에 실패했습니다.');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-base font-bold text-zinc-800 mb-2">회원가입 완료</h2>
          <p className="text-sm text-zinc-500 mb-4">
            관리자가 계정을 검토 후 승인합니다.<br />승인 완료 시 로그인하실 수 있습니다.
          </p>
          <button
            className="btn-primary w-full justify-center"
            onClick={() => navigate('/login')}
          >
            로그인 페이지로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg mb-4">
            <FolderKanban size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">ProjectHub</h1>
          <p className="text-xs text-zinc-500 mt-1">팀 협업 &amp; 프로젝트 관리 플랫폼</p>
        </div>

        <div className="card p-8">
          <h2 className="text-base font-bold text-zinc-800 mb-6">회원가입</h2>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">이름</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="input pl-9"
                  required
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                비밀번호 <span className="text-zinc-400 font-normal">(8자 이상)</span>
              </label>
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
              ) : '회원가입 신청'}
            </button>
          </form>

          <p className="text-xs text-center text-zinc-400 mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-zinc-900 font-semibold hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
