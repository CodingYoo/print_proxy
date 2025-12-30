import { useEffect, useState } from 'react'
import { Card, Table, Badge, Select } from '@/components/ui'
import { logsApi, jobsApi, LogEntry, PrintJob } from '@/api'
import { useMessageStore } from '@/store'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

function levelVariant(level: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    info: 'info',
    warning: 'warning',
    error: 'error',
  }
  return map[level] || 'default'
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const { showMessage } = useMessageStore()
  const pageSize = 15

  const loadData = async () => {
    try {
      const [l, j] = await Promise.all([
        logsApi.list(jobFilter ? Number(jobFilter) : undefined),
        jobsApi.list(0, 100),
      ])
      setLogs(l)
      setJobs(j)
    } catch {
      showMessage('加载日志失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [jobFilter])

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize))
  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize)

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'job_id', title: '任务ID' },
    {
      key: 'level',
      title: '级别',
      render: (l: LogEntry) => <Badge variant={levelVariant(l.level)}>{l.level.toUpperCase()}</Badge>,
    },
    { key: 'message', title: '消息', className: 'max-w-md truncate' },
    {
      key: 'created_at',
      title: '时间',
      render: (l: LogEntry) => <span className="text-xs text-slate-400">{formatDate(l.created_at)}</span>,
    },
  ]

  if (loading) {
    return <div className="text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">日志中心</h2>
          <p className="text-sm text-slate-500">查看打印任务的操作日志</p>
        </div>
        <div className="w-64">
          <Select
            value={jobFilter}
            onChange={(e) => {
              setJobFilter(e.target.value)
              setPage(1)
            }}
            options={[
              { value: '', label: '全部任务' },
              ...jobs.map((j) => ({ value: String(j.id), label: `#${j.id} ${j.title}` })),
            ]}
          />
        </div>
      </div>

      <Card padding="none">
        <Table columns={columns} data={paginatedLogs} rowKey="id" emptyText="暂无日志" />
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
        <p>共 {logs.length} 条记录</p>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-40"
          >
            上一页
          </button>
          <span>
            第 {page} / {totalPages} 页
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  )
}
