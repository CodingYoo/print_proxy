import { useState, useEffect } from 'react'
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
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Assume API prefix is /api, check root endpoint for status
        const res = await fetch('/api/')
        if (res.ok) {
          setIsOnline(true)
        } else {
          setIsOnline(false)
        }
      } catch {
        setIsOnline(false)
      }
    }

    checkStatus() // Initial check
    const timer = setInterval(checkStatus, 30000) // Poll every 30s
    return () => clearInterval(timer)
  }, [])

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
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
          isOnline ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
        )}>
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              isOnline ? "bg-emerald-400" : "bg-rose-400"
            )}></span>
            <span className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            )}></span>
          </span>
          <span className={cn(
            "text-xs font-semibold",
            isOnline ? "text-emerald-700" : "text-rose-700"
          )}>
            {isOnline ? "服务正常" : "服务异常"}
          </span>
        </div>
      </div>
    </header>
  )
}
