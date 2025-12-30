import { Card, Table, Badge } from '@/components/ui'

const API_ROUTES = [
  { method: 'POST', path: '/auth/token', desc: '获取访问令牌', auth: '无' },
  { method: 'POST', path: '/auth/users', desc: '创建用户', auth: '管理员' },
  { method: 'GET', path: '/auth/me', desc: '当前用户信息', auth: 'Bearer' },
  { method: 'POST', path: '/auth/users/{id}/api-key', desc: '生成 API Key', auth: '管理员' },
  { method: 'GET', path: '/printers/', desc: '打印机列表', auth: 'Bearer' },
  { method: 'POST', path: '/printers/sync', desc: '同步打印机', auth: '管理员' },
  { method: 'PUT', path: '/printers/{id}', desc: '更新打印机', auth: '管理员' },
  { method: 'POST', path: '/printers/{id}/default', desc: '设为默认打印机', auth: '管理员' },
  { method: 'POST', path: '/jobs/', desc: '创建打印任务', auth: 'Bearer 或 API Key' },
  { method: 'GET', path: '/jobs/', desc: '任务列表', auth: 'Bearer' },
  { method: 'GET', path: '/jobs/{id}', desc: '任务详情', auth: 'Bearer' },
  { method: 'PATCH', path: '/jobs/{id}', desc: '更新任务', auth: '任务所有者/管理员' },
  { method: 'POST', path: '/jobs/{id}/cancel', desc: '取消任务', auth: '任务所有者/管理员' },
  { method: 'GET', path: '/jobs/{id}/status', desc: '任务状态', auth: 'Bearer' },
  { method: 'GET', path: '/jobs/{id}/preview', desc: '任务预览', auth: '任务所有者/管理员' },
  { method: 'GET', path: '/logs/', desc: '日志查询', auth: 'Bearer' },
]

function methodVariant(method: string): 'success' | 'info' | 'warning' | 'error' | 'default' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    GET: 'success',
    POST: 'info',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'error',
  }
  return map[method] || 'default'
}

export function ApiDocsPage() {
  const columns = [
    {
      key: 'method',
      title: '方法',
      render: (r: (typeof API_ROUTES)[0]) => <Badge variant={methodVariant(r.method)}>{r.method}</Badge>,
    },
    {
      key: 'path',
      title: '路径',
      render: (r: (typeof API_ROUTES)[0]) => <code className="text-sm bg-slate-100 px-2 py-1 rounded">/api{r.path}</code>,
    },
    { key: 'desc', title: '描述' },
    { key: 'auth', title: '认证方式' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">API 接口</h2>
        <p className="text-sm text-slate-500">
          完整的 API 文档请访问{' '}
          <a href="/docs" target="_blank" className="text-blue-600 hover:underline">
            /docs
          </a>{' '}
          (Swagger UI)
        </p>
      </div>

      <Card padding="none">
        <Table columns={columns} data={API_ROUTES} rowKey="path" />
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4">使用示例</h3>
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto">
{`# 1. 获取访问令牌
curl -X POST http://localhost:8568/api/auth/token \\
  -d "username=admin&password=admin123&grant_type=password"

# 2. 创建打印任务
curl -X POST http://localhost:8568/api/jobs/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"测试打印","file_type":"png","content_base64":"..."}'`}
        </pre>
      </Card>
    </div>
  )
}
