import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/ui'
import { printersApi, jobsApi, Printer, PrintJob } from '@/api'
import { useMessageStore } from '@/store'

function translateStatus(status: string) {
  const map: Record<string, string> = {
    queued: '排队中', processing: '处理中', completed: '已完成', failed: '失败', cancelled: '已取消',
  }
  return map[status] || status
}

function statusVariant(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    completed: 'success', failed: 'error', cancelled: 'warning', processing: 'info', queued: 'info',
  }
  return map[status] || 'default'
}

export function OverviewPage() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const { showMessage } = useMessageStore()

  useEffect(() => {
    const load = async () => {
      try {
        const [p, j] = await Promise.all([printersApi.list(), jobsApi.list(0, 20)])
        setPrinters(p)
        setJobs(j)
      } catch {
        showMessage('加载数据失败', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showMessage])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  const defaultPrinter = printers.find((p) => p.is_default)
  const completedJobs = jobs.filter((j) => j.status === 'completed').length
  const failedJobs = jobs.filter((j) => j.status === 'failed').length
  const processingJobs = jobs.filter((j) => ['processing', 'queued'].includes(j.status)).length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '打印机', value: printers.length, sub: defaultPrinter?.name || '未设置', color: 'blue' },
          { label: '任务总数', value: jobs.length, sub: `处理中: ${processingJobs}`, color: 'violet' },
          { label: '已完成', value: completedJobs, sub: `${jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0}%`, color: 'emerald' },
          { label: '失败', value: failedJobs, sub: '查看日志', color: 'rose' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-medium text-slate-500 uppercase">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Jobs */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">最新任务</h2>
            <Link to="/dashboard/jobs" className="text-xs text-blue-600 hover:text-blue-700">查看全部</Link>
          </div>
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-slate-200 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{job.file_type}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{job.title}</p>
                    <p className="text-[10px] text-slate-500">份数: {job.copies}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-xs text-slate-400 text-center py-4">暂无任务</p>}
          </div>
        </Card>

        {/* Printers */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">打印机状态</h2>
            <Link to="/dashboard/printers" className="text-xs text-blue-600 hover:text-blue-700">管理</Link>
          </div>
          <div className="space-y-2">
            {printers.slice(0, 4).map((printer) => (
              <div key={printer.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${printer.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{printer.name}</p>
                    <p className="text-[10px] text-slate-500">{printer.status || '未知'}</p>
                  </div>
                </div>
                {printer.is_default && <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-blue-100 text-blue-700">默认</span>}
              </div>
            ))}
            {printers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">暂无打印机</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
