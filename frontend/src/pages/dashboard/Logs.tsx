import { useEffect, useState } from 'react'
import { Card, Badge, Select, Button } from '@/components/ui'
import { logsApi, jobsApi, LogEntry, PrintJob } from '@/api'
import { useMessageStore } from '@/store'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function levelVariant(level: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = { info: 'info', warning: 'warning', error: 'error' }
  return map[level] || 'default'
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const { showMessage } = useMessageStore()
  const pageSize = 12

  const loadData = async () => {
    setLoading(true)
    try {
      const [l, j] = await Promise.all([logsApi.list(jobFilter ? Number(jobFilter) : undefined), jobsApi.list(0, 100)])
      setLogs(l)
      setJobs(j)
    } catch {
      showMessage('加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [jobFilter])

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">日志中心</h2>
          <p className="text-xs text-slate-500">共 {logs.length} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-36">
            <Select value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1) }} options={[{ value: '', label: '全部任务' }, ...jobs.map((j) => ({ value: String(j.id), label: `#${j.id} ${j.title}` }))]} />
          </div>
          <Button size="sm" variant="secondary" onClick={loadData}>刷新</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" /></div>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-slate-100">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-slate-50 flex items-start space-x-2">
                <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${log.level === 'error' ? 'bg-rose-100' : log.level === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <span className={`text-[10px] font-bold ${log.level === 'error' ? 'text-rose-600' : log.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {log.level[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <Badge variant={levelVariant(log.level)}>{log.level.toUpperCase()}</Badge>
                    <span className="text-[10px] text-slate-400">任务 #{log.job_id}</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
            {paginatedLogs.length === 0 && <div className="p-8 text-center text-xs text-slate-400">暂无日志</div>}
          </div>
        </Card>
      )}

      {logs.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">共 {logs.length} 条</span>
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="px-2 text-slate-600">{page}/{totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  )
}
