import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Table } from '@/components/ui'
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const defaultPrinter = printers.find((p) => p.is_default)
  const completedJobsCount = jobs.filter((j) => j.status === 'completed').length
  const failedJobs = jobs.filter((j) => j.status === 'failed').length
  const processingJobs = jobs.filter((j) => ['processing', 'queued'].includes(j.status)).length
  const totalPrints = jobs.reduce((acc, job) => acc + (job.copies || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">概览</h2>
        <p className="text-sm text-slate-500">欢迎回来，这里是系统今日概况。</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '在线打印机', value: printers.length, sub: defaultPrinter ? `默认: ${defaultPrinter.name}` : '未设置默认', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '打印次数', value: totalPrints, sub: `活跃中: ${processingJobs}`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: '完成率', value: `${jobs.length ? Math.round((completedJobsCount / jobs.length) * 100) : 0}%`, sub: `已完成: ${completedJobsCount}`, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '异常任务', value: failedJobs, sub: failedJobs > 0 ? '请查看日志' : '系统正常', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="hover:shadow-md transition-all duration-200 border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded">{stat.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">最新任务</h3>
            <Link to="/dashboard/jobs" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">查看全部</Link>
          </div>
          <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <Table
                data={jobs.slice(0, 5)}
                rowKey="id"
                className="border-0 rounded-none shadow-none min-w-[600px]"
                columns={[
                  {
                    title: '文件', key: 'title', className: 'w-[40%]', render: (job) => (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase flex-shrink-0">
                          {job.file_type}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[150px]">{job.title}</p>
                          <p className="text-[10px] text-slate-400">{job.printer_name || '默认'}</p>
                        </div>
                      </div>
                    )
                  },
                  { title: '状态', key: 'status', render: (job) => <Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge> },
                  { title: '份数', key: 'copies', className: 'text-slate-500' },
                  { title: '时间', key: 'created_at', className: 'text-slate-400 text-xs', render: (job) => new Date(job.created_at).toLocaleTimeString() },
                ]}
              />
            </div>
          </Card>
        </div>

        {/* Printer Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">打印机队列</h3>
            <Link to="/dashboard/printers" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">管理</Link>
          </div>
          <div className="space-y-3">
            {printers.slice(0, 4).map((printer) => (
              <Card key={printer.id} padding="sm" className="flex items-center justify-between hover:border-indigo-200 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${printer.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <h4 className="text-sm font-medium text-slate-900">{printer.name}</h4>
                    <p className="text-[10px] text-slate-500">{printer.status || '未知状态'}</p>
                  </div>
                </div>
                {printer.is_default && <Badge variant="secondary" className="text-[10px]">默认</Badge>}
              </Card>
            ))}
            {printers.length === 0 && <p className="text-xs text-slate-400 text-center py-4">暂无打印机</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
