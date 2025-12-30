import { useEffect, useState, FormEvent } from 'react'
import { Card, Button, Table, Badge, Input, Select, Modal } from '@/components/ui'
import { jobsApi, printersApi, PrintJob, Printer, CreateJobParams } from '@/api'
import { useMessageStore } from '@/store'

function translateStatus(status: string) {
  const map: Record<string, string> = {
    queued: '排队中', processing: '处理中', completed: '已完成', failed: '失败', cancelled: '已取消',
  }
  return map[status] || status
}

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    completed: 'success', failed: 'error', cancelled: 'warning', processing: 'info', queued: 'info',
  }
  return map[status] || 'default'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}

export function JobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { showMessage } = useMessageStore()
  const pageSize = 10

  // Form state
  const [title, setTitle] = useState('')
  const [fileType, setFileType] = useState('')
  const [copies, setCopies] = useState(1)
  const [printerName, setPrinterName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [j, p] = await Promise.all([jobsApi.list(0, 100), printersApi.list()])
      setJobs(j)
      setPrinters(p)
    } catch {
      showMessage('加载数据失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleCancel = async (id: number) => {
    try {
      await jobsApi.cancel(id)
      await loadData()
      showMessage('任务已取消', 'success')
    } catch {
      showMessage('取消失败', 'error')
    }
  }

  const handlePreview = async (id: number) => {
    try {
      const blob = await jobsApi.getPreview(id)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      showMessage('预览加载失败', 'error')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) {
      showMessage('请选择文件', 'error')
      return
    }
    setSubmitting(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const params: CreateJobParams = {
          title, file_type: fileType || file.name.split('.').pop() || 'pdf',
          content_base64: base64, copies, printer_name: printerName || undefined,
        }
        await jobsApi.create(params)
        showMessage('任务创建成功', 'success')
        setTitle(''); setFileType(''); setCopies(1); setPrinterName(''); setFile(null)
        await loadData()
      }
      reader.readAsDataURL(file)
    } catch {
      showMessage('创建失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize))
  const paginatedJobs = jobs.slice((page - 1) * pageSize, page * pageSize)

  const columns = [
    {
      key: 'title', title: '标题',
      render: (j: PrintJob) => (
        <div>
          <p className="font-medium text-slate-800">{j.title}</p>
          {j.error_message && <p className="mt-1 text-xs text-rose-500">{j.error_message}</p>}
        </div>
      ),
    },
    { key: 'printer_name', title: '打印机', render: (j: PrintJob) => j.printer_name || '-' },
    { key: 'status', title: '状态', render: (j: PrintJob) => <Badge variant={statusVariant(j.status)}>{translateStatus(j.status)}</Badge> },
    { key: 'copies', title: '份数' },
    { key: 'file_type', title: '类型', render: (j: PrintJob) => j.file_type.toUpperCase() },
    { key: 'updated_at', title: '更新时间', render: (j: PrintJob) => <span className="text-xs text-slate-400">{formatDate(j.updated_at)}</span> },
    {
      key: 'actions', title: '操作',
      render: (j: PrintJob) => (
        <div className="flex space-x-2">
          <button onClick={() => handlePreview(j.id)} className="text-xs text-blue-600 hover:text-blue-700">预览</button>
          {['queued', 'processing'].includes(j.status) && (
            <button onClick={() => handleCancel(j.id)} className="text-xs text-rose-600 hover:text-rose-700">取消</button>
          )}
        </div>
      ),
    },
  ]

  if (loading) return <div className="text-slate-500">加载中...</div>

  return (
    <div className="flex flex-col xl:flex-row xl:space-x-6 space-y-6 xl:space-y-0">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">打印任务</h2>
            <p className="text-sm text-slate-500">实时查看任务状态并执行取消操作</p>
          </div>
          <Button variant="secondary" onClick={loadData}>刷新</Button>
        </div>

        <Card padding="none">
          <Table columns={columns} data={paginatedJobs} rowKey="id" emptyText="暂无任务" />
        </Card>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
          <p>共 {jobs.length} 条记录</p>
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span>第 {page} / {totalPages} 页</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      </div>

      <Card className="w-full xl:w-96">
        <h3 className="text-lg font-semibold text-slate-900">创建打印任务</h3>
        <p className="text-xs text-slate-400 mt-1">上传文件创建打印任务</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label="任务标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：月报打印" required />
          <Select
            label="选择打印机"
            value={printerName}
            onChange={(e) => setPrinterName(e.target.value)}
            options={[{ value: '', label: '使用默认打印机' }, ...printers.map((p) => ({ value: p.name, label: p.name }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="文件类型" value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="pdf/png" />
            <Input label="份数" type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">选择文件</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
          <Button type="submit" loading={submitting} className="w-full">提交任务</Button>
        </form>
      </Card>

      <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="任务预览">
        {previewUrl && <img src={previewUrl} alt="preview" className="max-w-full" />}
      </Modal>
    </div>
  )
}
