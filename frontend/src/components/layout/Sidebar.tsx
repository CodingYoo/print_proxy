import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store'

const navItems = [
  { path: '/dashboard', label: '总览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/dashboard/printers', label: '打印机', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
  { path: '/dashboard/jobs', label: '任务', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { path: '/dashboard/logs', label: '日志', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/dashboard/api', label: 'API', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-56 bg-slate-900 text-slate-100 shadow-xl
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-sm font-bold text-white">
              P
            </div>
            <div>
              <p className="text-sm font-semibold">PrintProxy</p>
              <p className="text-[10px] text-slate-500">打印代理服务</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-white border-l-2 border-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-violet-500 flex items-center justify-center text-xs font-medium text-white">
              {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.full_name || user?.username || '-'}</p>
              <p className="text-[10px] text-slate-500">{user?.is_admin ? '管理员' : '用户'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center py-1.5 rounded-md bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition text-xs text-slate-400"
          >
            退出登录
          </button>
        </div>
      </aside>
    </>
  )
}
