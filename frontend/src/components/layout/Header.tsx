import { useAuthStore } from '@/store'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()

  return (
    <header className="sticky top-0 z-30 h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <div className="flex items-center space-x-3">
        <button onClick={onMenuClick} className="md:hidden p-1.5 rounded hover:bg-slate-100">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-slate-800">控制台</h1>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-700">运行中</span>
        </div>
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <span className="text-xs text-slate-600 hidden sm:block">{user?.username}</span>
          <button onClick={logout} className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
