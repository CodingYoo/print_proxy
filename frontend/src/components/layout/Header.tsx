import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

const pathToName: Record<string, string> = {
  'dashboard': '总览',
  'printers': '打印机管理',
  'jobs': '任务列表',
  'logs': '系统日志',
  'api': 'API 文档'
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  // Generate breadcrumbs
  const breadcrumbs = pathSegments.map((segment, index) => {
    const isLast = index === pathSegments.length - 1
    const name = pathToName[segment] || segment
    return { name, isLast }
  })

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 transition-all duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center text-sm font-medium text-slate-500">
          <span className="text-slate-400 hover:text-slate-600 transition-colors">PrintProxy</span>
          {breadcrumbs.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <svg className="w-4 h-4 mx-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={cn(
                "transition-colors",
                item.isLast ? "text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-700"
              )}>
                {item.name}
              </span>
            </div>
          ))}
        </nav>

        {/* Mobile Title (when breadcrumbs hidden) */}
        <h1 className="sm:hidden text-lg font-semibold text-slate-900">
          {breadcrumbs[breadcrumbs.length - 1]?.name || '控制台'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-700">Service Active</span>
        </div>
      </div>
    </header>
  )
}
