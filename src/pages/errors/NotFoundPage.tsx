import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="relative inline-block mb-8">
          <p className="text-[120px] font-black text-zinc-100 dark:text-zinc-800 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔍</span>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
          요청하신 페이지가 존재하지 않거나<br />이동되었을 수 있습니다.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary gap-2"
          >
            <ArrowLeft size={14} /> 이전으로
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary gap-2"
          >
            <Home size={14} /> 홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
