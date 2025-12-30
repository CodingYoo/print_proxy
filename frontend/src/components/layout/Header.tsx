import { useAuthStore } from '@/store'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="h-20 bg-white shadow-sm flex items-center justify-between px-6 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">PrintProxy 控制台</h1>
        <p className="text-sm text-slate-500">统一管理打印机、打印任务与操作日志</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-3 bg-slate-100 rounded-full px-4 py-1.5">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-medium text-slate-600">
            {user?.full_name || user?.username || '-'}
          </span>
        </div>
        <button
          onClick={logout}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-900 text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
