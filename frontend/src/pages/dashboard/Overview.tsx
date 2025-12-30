import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/ui'
import { printersApi, jobsApi, Printer, PrintJob } from '@/api'
import { useMessageStore } from '@/store'

function translateStatus(status: string) {
  const map: Record<string, string> = {
    queued: '排队中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }
  return map[status] || status
}

function statusVariant(status: string) {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    completed: 'success',
    failed: 'error',
    cancelled: 'warning',
    processing: 'info',
    queued: 'info',
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
      } catch (err) {
        showMessage('加载数据失败', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showMessage])

  if (loading) {
    return <div className="text-slate-500">加载中...</div>
  }

  const defaultPrinter = printers.find((p) => p.is_default)
  const completedJobs = jobs.filter((j) => j.status === 'completed').length
  const failedJobs = jobs.filter((j) => j.status === 'failed').length
  const processingJobs = jobs.filter((j) => ['processing', 'queued'].includes(j.status)).length

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <p className="text-sm text-slate-500">打印机数量</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{printers.length}</p>
          <p className="mt-3 text-xs text-slate-400">默认打印机：{defaultPrinter?.name || '未设置'}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">任务总数</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{jobs.length}</p>
          <p className="mt-3 text-xs text-slate-400">处理中/排队：{processingJobs}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已完成</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">{completedJobs}</p>
          <p className="mt-3 text-xs text-emerald-500">
            完成率 {jobs.length ? Math.round((completedJobs / jobs.length) * 100) : 0}%
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">失败/异常</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">{failedJobs}</p>
          <p className="mt-3 text-xs text-rose-500">请留意错误日志排查原因</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最新打印任务</h2>
            <Link to="/dashboard/jobs" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id} className="py-3 flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    类型：{job.file_type.toUpperCase()} · 份数：{job.copies}
                  </p>
                </div>
                <Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-sm text-slate-400 py-4">暂无打印任务</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">打印机状态</h2>
            <Link to="/dashboard/printers" className="text-sm text-blue-600 hover:text-blue-700">
              管理打印机
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {printers.slice(0, 4).map((printer) => (
              <div key={printer.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-700">{printer.name}</p>
                  {printer.is_default && <Badge variant="info">默认</Badge>}
                </div>
                <p className="mt-2 text-xs text-slate-400">状态：{printer.status || '未知'}</p>
              </div>
            ))}
            {printers.length === 0 && <p className="text-sm text-slate-400">暂无打印机数据</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
