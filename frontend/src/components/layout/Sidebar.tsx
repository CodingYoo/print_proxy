import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store'

const navItems = [
  { path: '/dashboard', label: '总览', icon: 'dashboard' },
  { path: '/dashboard/printers', label: '打印机管理', icon: 'print' },
  { path: '/dashboard/jobs', label: '打印任务', icon: 'assignment' },
  { path: '/dashboard/logs', label: '日志中心', icon: 'history' },
  { path: '/dashboard/api', label: 'API 接口', icon: 'code' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="hidden md:flex md:flex-col w-72 bg-slate-950 text-slate-100 shadow-2xl">
      <div className="px-6 py-8 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl font-semibold text-blue-400">
            P
          </div>
          <div>
            <p className="text-lg font-semibold">PrintProxy</p>
            <p className="text-xs text-slate-400">Print Proxy Service</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center w-full px-4 py-3 rounded-xl text-left transition ${
                isActive
                  ? 'bg-white/5 border-l-4 border-blue-500 bg-gradient-to-r from-blue-500/30 to-transparent'
                  : 'hover:bg-white/5'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-6 border-t border-white/5">
        <div className="text-sm text-slate-400">登录账号</div>
        <div className="mt-2 text-base font-medium text-white truncate">
          {user?.full_name || user?.username || '-'}
        </div>
        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm"
        >
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}
