import { useEffect, useState } from 'react'
import { Select, Button, Table } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { logsApi, jobsApi, LogEntry, PrintJob } from '@/api'
import { useMessageStore } from '@/store'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
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

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleClearAll = async () => {
    setShowClearConfirm(false)
    try {
      await logsApi.clearAll()
      await loadData()
      showMessage('已清空所有日志', 'success')
    } catch {
      showMessage('清空失败', 'error')
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
          <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setShowClearConfirm(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            全部清空
          </Button>
          <Button size="sm" variant="secondary" onClick={loadData}>刷新</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" /></div>
      ) : (
        <Table<LogEntry>
          columns={[
            {
              key: 'level',
              title: '级别',
              width: '80px',
              render: (log) => (
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${log.level === 'error' ? 'bg-rose-500' : log.level === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <span className={`text-xs font-medium uppercase ${log.level === 'error' ? 'text-rose-600' : log.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{log.level}</span>
                </div>
              )
            },
            {
              key: 'message',
              title: '日志内容',
              className: 'text-slate-700 font-medium',
              render: (log) => (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {log.category && <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">{log.category}</span>}
                    {log.job_id && <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Job #{log.job_id}</span>}
                  </div>
                  <p>{log.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {log.id}</p>
                </div>
              )
            },
            {
              key: 'created_at',
              title: '时间',
              width: '180px',
              className: 'text-slate-500 text-xs tabular-nums',
              render: (log) => formatDate(log.created_at)
            }
          ]}
          data={paginatedLogs}
          rowKey="id"
          emptyText="暂无系统日志"
        />
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
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="清空日志"
        message="确定清空所有日志吗？此操作不可恢复。"
        confirmText="确认清空"
        danger
      />
    </div>
  )
}
