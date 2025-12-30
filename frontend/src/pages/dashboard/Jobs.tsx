import { useEffect, useState, FormEvent } from 'react'
import { Card, Button, Badge, Input, Select, Modal, Table } from '@/components/ui'
import { jobsApi, printersApi, PrintJob, Printer, CreateJobParams } from '@/api'
import { useMessageStore } from '@/store'

function translateStatus(status: string) {
  const map: Record<string, string> = { queued: '排队中', processing: '处理中', completed: '已完成', failed: '失败', cancelled: '已取消' }
  return map[status] || status
}

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = { completed: 'success', failed: 'error', cancelled: 'warning', processing: 'info', queued: 'info' }
  return map[status] || 'default'
}

export function JobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'text'>('image')
  const [showForm, setShowForm] = useState(false)
  const { showMessage } = useMessageStore()
  const pageSize = 10

  // Form State
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
      showMessage('加载失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleCancel = async (id: number) => {
    if (!confirm('确定取消该任务吗？')) return
    try {
      await jobsApi.cancel(id)
      await loadData()
      showMessage('已取消', 'success')
    } catch {
      showMessage('取消失败', 'error')
    }
  }

  const handlePreview = async (id: number, fileType: string) => {
    try {
      const blob = await jobsApi.getPreview(id)
      const text = await blob.text()

      let finalBlob = blob
      // Check if content is Base64 (simple heuristic: no binary signature like %PDF or PNG header, and valid base64 chars)
      const isLikelyBase64 = !text.startsWith('%PDF') && !text.startsWith('\x89PNG') && /^[a-zA-Z0-9+/=\s]+$/.test(text)

      if (isLikelyBase64) {
        try {
          const byteCharacters = atob(text.trim())
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const mime = fileType === 'pdf' ? 'application/pdf' :
            fileType === 'png' ? 'image/png' :
              ['jpg', 'jpeg'].includes(fileType) ? 'image/jpeg' : 'text/plain'
          finalBlob = new Blob([byteArray], { type: mime })
        } catch (e) {
          console.error('Base64 decode failed, using original blob', e)
        }
      } else {
        // Verify/Enforce MIME type if it's binary
        const mime = fileType === 'pdf' ? 'application/pdf' :
          fileType === 'png' ? 'image/png' :
            ['jpg', 'jpeg'].includes(fileType) ? 'image/jpeg' : 'text/plain'
        finalBlob = blob.slice(0, blob.size, mime)
      }

      setPreviewType(finalBlob.type === 'application/pdf' ? 'pdf' : finalBlob.type.startsWith('image/') ? 'image' : 'text')
      setPreviewUrl(URL.createObjectURL(finalBlob))
    } catch (e) {
      console.error(e)
      showMessage('预览失败: 无法解析文件', 'error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile && !title) {
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.')
      setTitle(fileName)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) { showMessage('请选择文件', 'error'); return }
    setSubmitting(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const params: CreateJobParams = {
          title,
          file_type: fileType || file.name.split('.').pop() || 'pdf',
          content_base64: base64,
          copies,
          printer_name: printerName || undefined,
        }
        await jobsApi.create(params)
        showMessage('任务创建成功', 'success')
        setTitle(''); setFileType(''); setCopies(1); setPrinterName(''); setFile(null)
        setShowForm(false)
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
      key: 'title',
      title: '任务详情',
      render: (job: PrintJob) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{job.file_type}</span>
          </div>
          <div className="min-w-0 max-w-[200px] sm:max-w-xs">
            <p className="text-sm font-medium text-slate-900 truncate" title={job.title}>{job.title}</p>
            {job.error_message && <p className="text-xs text-rose-500 truncate">{job.error_message}</p>}
          </div>
        </div>
      )
    },
    {
      key: 'printer',
      title: '打印机',
      className: 'hidden sm:table-cell',
      render: (job: PrintJob) => <span className="text-slate-600">{job.printer_name || <Badge variant="secondary" className="text-[10px]">默认</Badge>}</span>
    },
    {
      key: 'status',
      title: '状态',
      render: (job: PrintJob) => <Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge>
    },
    {
      key: 'copies',
      title: '份数',
      className: 'text-slate-600 w-16 text-center',
      render: (job: PrintJob) => job.copies
    },
    {
      key: 'time',
      title: '提交时间',
      className: 'hidden md:table-cell text-slate-500',
      render: (job: PrintJob) => new Date(job.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    },
    {
      key: 'actions',
      title: '操作',
      className: 'text-right',
      render: (job: PrintJob) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePreview(job.id, job.file_type) }} title="预览">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </Button>
          {['queued', 'processing'].includes(job.status) && (
            <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={(e) => { e.stopPropagation(); handleCancel(job.id) }} title="取消">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">打印任务</h2>
          <p className="text-sm text-slate-500">查看和管理所有的打印排队任务。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadData}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            刷新
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            新建任务
          </Button>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden border-slate-200">
        <Table
          columns={columns}
          data={paginatedJobs}
          rowKey="id"
          loading={loading}
          emptyText="暂无打印任务"
        />

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">第 {page} / {totalPages} 页 (共 {jobs.length} 条)</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="新建打印任务">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="任务标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如: 财务报表_2024" required fullWidth />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="选择打印机"
              value={printerName}
              onChange={(e) => setPrinterName(e.target.value)}
              options={[{ value: '', label: '自动选择 (默认)' }, ...printers.map((p) => ({ value: p.name, label: p.name }))]}
            />
            <Input label="份数" type="number" min={1} max={99} value={copies} onChange={(e) => setCopies(Number(e.target.value))} fullWidth />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">上传文件</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 hover:border-indigo-400 transition-colors cursor-pointer relative">
              <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg,.txt" />
              <div className="space-y-1 text-center pointer-events-none">
                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-indigo-600">{file ? file.name : '点击上传'}</span>
                  <span className="pl-1">或拖拽文件至此</span>
                </div>
                <p className="text-xs text-slate-500">支持 PDF, PNG, JPG, TXT</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" loading={submitting}>确认创建</Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="文件预览" className="max-w-3xl">
        {previewUrl && (
          <div className={`bg-slate-100 rounded-lg overflow-hidden flex justify-center items-center ${previewType === 'pdf' ? 'h-[75vh]' : 'min-h-[200px] p-8'}`}>
            {previewType === 'pdf' ? (
              <iframe src={previewUrl} className="w-full h-full border-none" title="预览" />
            ) : (
              <img src={previewUrl} alt="预览" className="max-w-full max-h-[70vh] object-contain shadow-lg rounded bg-white ring-1 ring-slate-200" />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
