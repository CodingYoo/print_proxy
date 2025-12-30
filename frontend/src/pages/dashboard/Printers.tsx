import { useEffect, useState } from 'react'
import { Card, Button, Badge, Modal, Input, Table } from '@/components/ui'
import { printersApi, Printer, PrinterJob } from '@/api'
import { useAuthStore, useMessageStore } from '@/store'
import { cn } from '@/lib/utils'



export function PrintersPage() {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { user } = useAuthStore()
  const { showMessage } = useMessageStore()

  // Modal States
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null)
  const [viewingQueuePrinter, setViewingQueuePrinter] = useState<Printer | null>(null)
  const [queueJobs, setQueueJobs] = useState<PrinterJob[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)

  // Edit Form State
  const [editForm, setEditForm] = useState({ alias: '', location: '', description: '' })

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

  const handleTestPage = async (id: number) => {
    try {
      await printersApi.testPage(id)
      showMessage('测试页指令已发送', 'success')
    } catch {
      showMessage('测试页发送失败', 'error')
    }
  }

  // Edit Handlers
  const openEdit = (printer: Printer) => {
    setEditingPrinter(printer)
    setEditForm({
      alias: printer.alias || '',
      location: printer.location || '',
      description: printer.description || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingPrinter) return
    try {
      await printersApi.update(editingPrinter.id, editForm)
      await loadPrinters()
      setEditingPrinter(null)
      showMessage('更新成功', 'success')
    } catch {
      showMessage('更新失败', 'error')
    }
  }

  // Queue Handlers
  const openQueue = async (printer: Printer) => {
    setViewingQueuePrinter(printer)
    setLoadingQueue(true)
    try {
      const jobs = await printersApi.getJobs(printer.id)
      setQueueJobs(jobs)
    } catch {
      showMessage('获取队列失败', 'error')
    } finally {
      setLoadingQueue(false)
    }
  }

  const handleClearQueue = async () => {
    if (!viewingQueuePrinter) return
    try {
      await printersApi.clearQueue(viewingQueuePrinter.id)
      setQueueJobs([])
      showMessage('队列已清空', 'success')
    } catch {
      showMessage('清空失败', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">打印设备</h2>
          <p className="text-slate-500 mt-1">管理网络中的所有打印资源与连接状态。</p>
        </div>
        {user?.is_admin && (
          <Button onClick={handleSync} loading={syncing} size="lg" className="shadow-md shadow-indigo-100">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            同步打印机
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {printers.map((printer) => {
          const isOnline = printer.status === 'online'
          return (
            <Card
              key={printer.id}
              padding="none"
              className={cn(
                "group relative overflow-hidden transition-all duration-300 border-0 shadow-sm ring-1 ring-slate-200 hover:shadow-xl hover:-translate-y-1 hover:ring-indigo-100 bg-white",
                printer.is_default && "ring-2 ring-indigo-500/20 shadow-md"
              )}
            >
              <div className="absolute top-0 right-0 p-4 z-10">
                {printer.is_default ? (
                  <Badge variant="default" className="shadow-sm bg-indigo-600">默认</Badge>
                ) : (
                  <Badge variant={isOnline ? 'success' : 'secondary'} className={cn("backdrop-blur-sm", !isOnline && "bg-slate-100/80")}>
                    {printer.status || '未知'}
                  </Badge>
                )}
              </div>

              <div className="p-6 pt-8">
                <div className="flex justify-center mb-6 relative">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                    isOnline ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"
                  )}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-1 right-[calc(50%-2.5rem)] flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white"></span>
                    </span>
                  )}
                </div>

                <div className="text-center space-y-1 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 truncate px-2" title={printer.name}>
                    {printer.alias || printer.name}
                  </h3>
                  {printer.alias && (
                    <p className="text-xs text-slate-400 font-mono truncate px-4">{printer.name}</p>
                  )}
                  {printer.location && (
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {printer.location}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex gap-2">
                    {user?.is_admin && (
                      <>
                        <button onClick={() => openEdit(printer)} className="hover:text-indigo-600 transition-colors">编辑</button>
                        <button onClick={() => openQueue(printer)} className="hover:text-indigo-600 transition-colors">队列</button>
                        <button onClick={() => handleTestPage(printer.id)} className="hover:text-indigo-600 transition-colors">测试页</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Overlay */}
              {user?.is_admin && !printer.is_default && (
                <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 backdrop-blur-sm border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                    onClick={() => handleSetDefault(printer.id)}
                  >
                    设为默认设备
                  </Button>
                </div>
              )}
            </Card>
          )
        })}

        {printers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-base font-medium text-slate-900">暂无打印机信息</p>
            <p className="text-sm text-slate-500 mt-1">请尝试点击右上角的同步按钮获取设备列表</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingPrinter}
        onClose={() => setEditingPrinter(null)}
        title="编辑打印机"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">别名</label>
            <Input
              value={editForm.alias}
              onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
              placeholder="例如：财务室打印机"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">位置</label>
            <Input
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="例如：一楼大厅"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="备注信息"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button variant="outline" onClick={() => setEditingPrinter(null)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </div>
        </div>
      </Modal>

      {/* Queue Modal */}
      <Modal
        open={!!viewingQueuePrinter}
        onClose={() => setViewingQueuePrinter(null)}
        title={`打印队列 - ${viewingQueuePrinter?.alias || viewingQueuePrinter?.name}`}
        className="max-w-3xl"
      >
        <div className="bg-white rounded-lg">
          <div className="min-h-[200px] mb-4">
            {loadingQueue ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <Table<PrinterJob>
                columns={[
                  { key: 'id', title: 'ID', width: '80px' },
                  { key: 'document', title: '文档' },
                  { key: 'user', title: '用户' },
                  { key: 'status_string', title: '状态', render: (job) => job.status_string || String(job.status) },
                  { key: 'pages', title: '页数', width: '80px' },
                  { key: 'submitted', title: '提交时间' }
                ]}
                data={queueJobs}
                rowKey="id"
                emptyText="当前没有正在进行的任务"
              />
            )}
          </div>

          <div className="flex justify-between w-full pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => openQueue(viewingQueuePrinter!)} disabled={loadingQueue}>刷新</Button>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleClearQueue} disabled={queueJobs.length === 0}>清空队列</Button>
              <Button variant="secondary" onClick={() => setViewingQueuePrinter(null)}>关闭</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

