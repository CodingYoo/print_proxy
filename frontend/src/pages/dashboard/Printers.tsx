import { useEffect, useState } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import { printersApi, Printer } from '@/api'
import { useAuthStore, useMessageStore } from '@/store'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
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
      showMessage('加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPrinters() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await printersApi.sync()
      await loadPrinters()
      showMessage('同步完成', 'success')
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
      showMessage('已设为默认', 'success')
    } catch {
      showMessage('设置失败', 'error')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">打印机管理</h2>
          <p className="text-xs text-slate-500">共 {printers.length} 台打印机</p>
        </div>
        {user?.is_admin && (
          <Button size="sm" onClick={handleSync} loading={syncing}>同步</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {printers.map((printer) => (
          <Card key={printer.id} className="p-3">
            <div className={`h-0.5 -mx-3 -mt-3 mb-3 rounded-t-xl ${printer.status === 'online' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${printer.status === 'online' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <svg className={`w-4 h-4 ${printer.status === 'online' ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 line-clamp-1">{printer.name}</h3>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <Badge variant={printer.status === 'online' ? 'success' : 'default'}>{printer.status || '未知'}</Badge>
                    {printer.is_default && <Badge variant="info">默认</Badge>}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p>位置: {printer.location || '-'}</p>
              <p>添加: {formatDate(printer.created_at)}</p>
            </div>
            {user?.is_admin && !printer.is_default && (
              <button onClick={() => handleSetDefault(printer.id)} className="mt-2 w-full py-1.5 rounded border border-slate-200 text-[10px] font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600">
                设为默认
              </button>
            )}
          </Card>
        ))}
      </div>

      {printers.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-xs text-slate-400">暂无打印机</p>
          {user?.is_admin && <Button size="sm" onClick={handleSync} className="mt-3">同步打印机</Button>}
        </Card>
      )}
    </div>
  )
}
