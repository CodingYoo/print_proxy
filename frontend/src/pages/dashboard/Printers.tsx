import { useEffect, useState } from 'react'
import { Card, Button, Table, Badge } from '@/components/ui'
import { printersApi, Printer } from '@/api'
import { useAuthStore, useMessageStore } from '@/store'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

export function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { user } = useAuthStore()
  const { showMessage } = useMessageStore()

  const loadPrinters = async () => {
    try {
      const data = await printersApi.list()
      setPrinters(data)
    } catch {
      showMessage('加载打印机列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrinters()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await printersApi.sync()
      await loadPrinters()
      showMessage('打印机同步完成', 'success')
    } catch {
      showMessage('同步失败', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await printersApi.setDefault(id)
      await loadPrinters()
      showMessage('默认打印机已更新', 'success')
    } catch {
      showMessage('设置失败', 'error')
    }
  }

  const columns = [
    { key: 'name', title: '名称', render: (p: Printer) => <span className="font-medium text-slate-700">{p.name}</span> },
    {
      key: 'status',
      title: '状态',
      render: (p: Printer) => (
        <Badge variant={p.status === 'online' ? 'success' : 'default'}>{p.status || '未知'}</Badge>
      ),
    },
    { key: 'location', title: '位置', render: (p: Printer) => p.location || '-' },
    {
      key: 'is_default',
      title: '默认',
      render: (p: Printer) =>
        p.is_default ? (
          <span className="text-emerald-600 font-medium">是</span>
        ) : (
          <span className="text-slate-400">否</span>
        ),
    },
    { key: 'created_at', title: '创建时间', render: (p: Printer) => <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span> },
    ...(user?.is_admin
      ? [
          {
            key: 'actions',
            title: '操作',
            render: (p: Printer) =>
              p.is_default ? (
                <span className="text-xs text-slate-300">已是默认</span>
              ) : (
                <button
                  onClick={() => handleSetDefault(p.id)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  设为默认
                </button>
              ),
          },
        ]
      : []),
  ]

  if (loading) {
    return <div className="text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">打印机管理</h2>
          <p className="text-sm text-slate-500">查看系统打印机列表并同步状态</p>
        </div>
        {user?.is_admin && (
          <Button onClick={handleSync} loading={syncing}>
            同步打印机
          </Button>
        )}
      </div>

      <Card padding="none">
        <Table columns={columns} data={printers} rowKey="id" emptyText="暂无打印机数据" />
      </Card>
    </div>
  )
}
