
import { useEffect, useState } from 'react'
import { Card, Button, Badge, Modal, Input, Table } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { printersApi, Printer, PrinterJob, MaintenanceLog, PrinterStatus } from '@/api'
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

  // Maintenance State
  const [maintenancePrinter, setMaintenancePrinter] = useState<Printer | null>(null)
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [loadingMaintenance, setLoadingMaintenance] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({ title: '', description: '', cost: 0 })

  // Detailed Status State
  const [statuses, setStatuses] = useState<Record<number, PrinterStatus>>({})

  // Edit Form State
  const [editForm, setEditForm] = useState({ alias: '', location: '', description: '', capabilities: '' })

  const loadPrinters = async () => {
    try {
      const data = await printersApi.list()
      // Sort: Default printer first, then by ID or Name
      const sorted = data.sort((a, b) => {
        if (a.is_default === b.is_default) return 0
        return a.is_default ? -1 : 1
      })
      setPrinters(sorted)
    } catch {
      showMessage('加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPrinters() }, [])

  // Fetch detailed status for all printers
  useEffect(() => {
    if (printers.length === 0) return

    const fetchStatuses = async () => {
      const newStatuses: Record<number, PrinterStatus> = {}
      await Promise.all(printers.map(async (p) => {
        try {
          const status = await printersApi.getStatus(p.id)
          newStatuses[p.id] = status
        } catch (e) {
          console.error(`Failed to fetch status for ${p.name}`, e)
        }
      }))
      setStatuses(newStatuses)
    }

    fetchStatuses()
    // Poll every 10 seconds
    const interval = setInterval(fetchStatuses, 10000)
    return () => clearInterval(interval)
  }, [printers])

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

  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null)

  const confirmDeletePrinter = async () => {
    if (!deleteCandidate) return
    try {
      await printersApi.delete(deleteCandidate)
      await loadPrinters()
      showMessage('打印机已移除', 'success')
    } catch {
      showMessage('移除失败', 'error')
    } finally {
      setDeleteCandidate(null)
    }
  }

  // Edit Handlers
  const openEdit = (printer: Printer) => {
    setEditingPrinter(printer)
    setEditForm({
      alias: printer.alias || '',
      location: printer.location || '',
      description: printer.description || '',
      capabilities: printer.capabilities || ''
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

  // Maintenance Handlers
  const openMaintenance = async (printer: Printer) => {
    setMaintenancePrinter(printer)
    setLoadingMaintenance(true)
    try {
      const logs = await printersApi.getMaintenanceLogs(printer.id)
      setMaintenanceLogs(logs)
      setMaintenanceForm({ title: '', description: '', cost: 0 })
    } catch {
      showMessage('获取维护记录失败', 'error')
    } finally {
      setLoadingMaintenance(false)
    }
  }

  const handleCreateMaintenance = async () => {
    if (!maintenancePrinter) return
    if (!maintenanceForm.title) {
      showMessage('请填写记录标题', 'error')
      return
    }
    try {
      await printersApi.addMaintenanceLog(maintenancePrinter.id, maintenanceForm)
      const logs = await printersApi.getMaintenanceLogs(maintenancePrinter.id)
      setMaintenanceLogs(logs)
      setMaintenanceForm({ title: '', description: '', cost: 0 })
      showMessage('记录添加成功', 'success')
    } catch {
      showMessage('添加失败', 'error')
    }
  }

  const handleDeleteMaintenance = async (logId: number) => {
    if (!maintenancePrinter) return
    try {
      await printersApi.deleteMaintenanceLog(maintenancePrinter.id, logId)
      setMaintenanceLogs(maintenanceLogs.filter(l => l.id !== logId))
      showMessage('记录已删除', 'success')
    } catch {
      showMessage('删除失败', 'error')
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {printers.map((printer) => {
          const detailedStatus = statuses[printer.id]
          const hasError = detailedStatus && detailedStatus.code !== 0 && detailedStatus.messages.length > 0 && !detailedStatus.messages.includes('就绪')
          const isOnline = printer.status === 'online'
          const statusText = hasError ? detailedStatus.messages.join(', ') : (isOnline ? '就绪' : '离线')

          return (
            <div
              key={printer.id}
              className={cn(
                "group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden",
                printer.is_default && "ring-1 ring-indigo-500 border-indigo-500 shadow-indigo-50"
              )}
            >
              {/* Header Status Bar */}
              <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-2.5 w-2.5 rounded-full ring-2 ring-white",
                    hasError ? "bg-red-500" : (isOnline ? "bg-emerald-500" : "bg-slate-300")
                  )} />
                  <span className={cn("text-xs font-medium", hasError ? "text-red-600" : "text-slate-600")}>
                    {statusText}
                  </span>
                </div>
                {printer.is_default && (
                  <Badge variant="default" className="text-[10px] h-5 px-2 bg-indigo-600 border-none shadow-none">
                    默认
                  </Badge>
                )}
              </div>

              {/* Main Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  {detailedStatus?.jobs_count !== undefined && detailedStatus.jobs_count > 0 && (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                      {detailedStatus.jobs_count} 任务
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1 truncate" title={printer.alias || printer.name}>
                  {printer.alias || printer.name}
                </h3>

                <div className="space-y-1 mb-4">
                  {printer.alias && (
                    <p className="text-xs text-slate-400 font-mono truncate" title={printer.name}>{printer.name}</p>
                  )}
                  {printer.location ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {printer.location}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300 italic">未设置位置</p>
                  )}
                </div>

                {printer.capabilities && (
                  <div className="flex flex-wrap gap-1.5 mt-auto mb-4">
                    {printer.capabilities.split(/[,，]/).slice(0, 3).map((cap, i) => (
                      <span key={i} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {cap.trim()}
                      </span>
                    ))}
                    {printer.capabilities.split(/[,，]/).length > 3 && (
                      <span className="text-[10px] text-slate-400 px-1">+</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                {user?.is_admin ? (
                  <>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openQueue(printer)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="打印队列"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </button>
                      <button
                        onClick={() => openEdit(printer)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="编辑设置"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => openMaintenance(printer)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="维护记录"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      <button
                        title="从列表中移除"
                        onClick={() => setDeleteCandidate(printer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                    <div className="flex gap-1 ml-auto">
                      {!printer.is_default && (
                        <button
                          onClick={() => handleSetDefault(printer.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          设默认
                        </button>
                      )}
                      <button
                        onClick={() => handleTestPage(printer.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="打印测试页"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 ml-auto">仅管理员可操作</span>
                )}
              </div>
            </div>
          )
        })}

        {printers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </div>
            <p className="text-slate-900 font-medium">暂无设备</p>
            <p className="text-slate-500 text-sm mt-1">点击右上角同步按钮获取打印机</p>
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">能力标签 (用逗号分隔)</label>
            <Input
              value={editForm.capabilities}
              onChange={(e) => setEditForm({ ...editForm, capabilities: e.target.value })}
              placeholder="例如：自动双面, A3, 彩色"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
            <Button variant="outline" onClick={() => setEditingPrinter(null)}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </div>
        </div>
      </Modal>

      {/* Maintenance Modal */}
      <Modal
        open={!!maintenancePrinter}
        onClose={() => setMaintenancePrinter(null)}
        title={`维护记录 - ${maintenancePrinter?.alias || maintenancePrinter?.name} `}
        className="max-w-4xl"
      >
        <div className="bg-white rounded-lg space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3">新增记录</h4>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">标题</label>
                <Input
                  value={maintenanceForm.title}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                  placeholder="例如：更换黑色硒鼓"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">描述</label>
                <Input
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="备注细节"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">费用 (元)</label>
                <Input
                  type="number"
                  value={maintenanceForm.cost}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleCreateMaintenance} className="w-full">添加</Button>
              </div>
            </div>
          </div>

          <div className="min-h-[200px]">
            {loadingMaintenance ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <Table<MaintenanceLog>
                columns={[
                  { key: 'created_at', title: '时间', width: '180px', render: (log) => new Date(log.created_at).toLocaleString() },
                  { key: 'title', title: '项目', width: '200px', className: 'font-medium' },
                  { key: 'description', title: '描述' },
                  { key: 'cost', title: '费用', width: '100px', render: (log) => `¥${log.cost.toFixed(2)} ` },
                  {
                    key: 'actions', title: '操作', width: '80px', render: (log) => (
                      <button onClick={() => handleDeleteMaintenance(log.id)} className="text-red-500 hover:text-red-700 text-xs text-center w-full">删除</button>
                    )
                  }
                ]}
                data={maintenanceLogs}
                rowKey="id"
                emptyText="暂无维护记录"
              />
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setMaintenancePrinter(null)}>关闭</Button>
          </div>
        </div>
      </Modal>

      {/* Queue Modal */}
      <Modal
        open={!!viewingQueuePrinter}
        onClose={() => setViewingQueuePrinter(null)}
        title={`打印队列 - ${viewingQueuePrinter?.alias || viewingQueuePrinter?.name} `}
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
      <ConfirmDialog
        open={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDeletePrinter}
        title="移除打印机"
        message={`确定要移除该打印机吗？\n注意：这仅会从本系统的列表中移除记录，不会从 Windows 系统中卸载驱动。`}
        confirmText="确认移除"
        danger
      />
    </div>
  )
}

