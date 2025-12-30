import { useEffect, useState, FormEvent } from 'react'
import { Card, Button, Badge, Input, Select, Modal } from '@/components/ui'
import { jobsApi, printersApi, PrintJob, Printer, CreateJobParams } from '@/api'
import { useMessageStore } from '@/store'

function translateStatus(status: string) {
  const map: Record<string, string> = { queued: '排队', processing: '处理中', completed: '完成', failed: '失败', cancelled: '取消' }
  return map[status] || status
}

function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info'> = { completed: 'success', failed: 'error', cancelled: 'warning', processing: 'info', queued: 'info' }
  return map[status] || 'default'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function JobsPage() {
  const [jobs, setJobs] = useState<PrintJob[]>([])
  const [printers, setPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { showMessage } = useMessageStore()
  const pageSize = 8

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
    try {
      await jobsApi.cancel(id)
      await loadData()
      showMessage('已取消', 'success')
    } catch {
      showMessage('取消失败', 'error')
    }
  }

  const handlePreview = async (id: number) => {
    try {
      const blob = await jobsApi.getPreview(id)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      showMessage('预览失败', 'error')
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
          title, file_type: fileType || file.name.split('.').pop() || 'pdf',
          content_base64: base64, copies, printer_name: printerName || undefined,
        }
        await jobsApi.create(params)
        showMessage('创建成功', 'success')
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

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">打印任务</h2>
          <p className="text-xs text-slate-500">共 {jobs.length} 个任务</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={loadData}>刷新</Button>
          <Button size="sm" onClick={() => setShowForm(true)}>新建</Button>
        </div>
      </div>

      <Card padding="none">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">任务</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">打印机</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">状态</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">份数</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500">时间</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-500 uppercase">{job.file_type}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{job.title}</p>
                        {job.error_message && <p className="text-[10px] text-rose-500">{job.error_message}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{job.printer_name || '-'}</td>
                  <td className="px-3 py-2"><Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge></td>
                  <td className="px-3 py-2 text-slate-600">{job.copies}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(job.updated_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => handlePreview(job.id)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      {['queued', 'processing'].includes(job.status) && (
                        <button onClick={() => handleCancel(job.id)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedJobs.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">暂无任务</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedJobs.map((job) => (
            <div key={job.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">{job.file_type}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900">{job.title}</p>
                    <p className="text-[10px] text-slate-500">{job.printer_name || '默认'}</p>
                  </div>
                </div>
                <Badge variant={statusVariant(job.status)}>{translateStatus(job.status)}</Badge>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">份数: {job.copies}</span>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handlePreview(job.id)} className="text-blue-600">预览</button>
                  {['queued', 'processing'].includes(job.status) && <button onClick={() => handleCancel(job.id)} className="text-rose-600">取消</button>}
                </div>
              </div>
            </div>
          ))}
          {paginatedJobs.length === 0 && <p className="p-6 text-center text-xs text-slate-400">暂无任务</p>}
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">共 {jobs.length} 条</span>
        <div className="flex items-center space-x-1">
          <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>上一页</Button>
          <span className="px-2 text-slate-600">{page}/{totalPages}</span>
          <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="新建任务">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="任务标题" required />
          <Select label="打印机" value={printerName} onChange={(e) => setPrinterName(e.target.value)} options={[{ value: '', label: '默认打印机' }, ...printers.map((p) => ({ value: p.name, label: p.name }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="类型" value={fileType} onChange={(e) => setFileType(e.target.value)} placeholder="自动" />
            <Input label="份数" type="number" min={1} value={copies} onChange={(e) => setCopies(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">文件</label>
            <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-blue-400">
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer text-xs text-slate-600">{file ? file.name : '点击选择文件'}</label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
            <Button type="submit" size="sm" loading={submitting}>提交</Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewUrl} onClose={() => setPreviewUrl(null)} title="预览">
        {previewUrl && <img src={previewUrl} alt="preview" className="max-w-full rounded" />}
      </Modal>
    </div>
  )
}
