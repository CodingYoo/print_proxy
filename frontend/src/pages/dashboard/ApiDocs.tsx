import { Card } from '@/components/ui'

const API_ROUTES = [
  { method: 'POST', path: '/auth/token', desc: '获取令牌' },
  { method: 'GET', path: '/auth/me', desc: '当前用户' },
  { method: 'GET', path: '/printers/', desc: '打印机列表' },
  { method: 'POST', path: '/printers/sync', desc: '同步打印机' },
  { method: 'POST', path: '/printers/{id}/default', desc: '设为默认' },
  { method: 'POST', path: '/jobs/', desc: '创建任务' },
  { method: 'GET', path: '/jobs/', desc: '任务列表' },
  { method: 'POST', path: '/jobs/{id}/cancel', desc: '取消任务' },
  { method: 'GET', path: '/jobs/{id}/preview', desc: '预览' },
  { method: 'GET', path: '/logs/', desc: '日志查询' },
]

function methodColor(method: string) {
  const colors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PUT: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-rose-100 text-rose-700',
  }
  return colors[method] || 'bg-slate-100 text-slate-700'
}

export function ApiDocsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">API 接口</h2>
        <p className="text-xs text-slate-500">
          完整文档: <a href="/docs" target="_blank" className="text-blue-600 hover:underline">/docs</a>
        </p>
      </div>

      <Card padding="none">
        <div className="divide-y divide-slate-100">
          {API_ROUTES.map((route, idx) => (
            <div key={idx} className="px-3 py-2 hover:bg-slate-50 flex items-center space-x-3">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${methodColor(route.method)}`}>{route.method}</span>
              <code className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">/api{route.path}</code>
              <span className="text-xs text-slate-500">{route.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">示例</h3>
        <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] overflow-x-auto">
{`# 获取令牌
curl -X POST http://localhost:8568/api/auth/token \\
  -d "username=admin&password=admin123&grant_type=password"

# 创建任务
curl -X POST http://localhost:8568/api/jobs/ \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"测试","file_type":"png","content_base64":"..."}'`}
        </pre>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/docs', label: 'Swagger UI', desc: '交互式文档', color: 'blue' },
          { href: '/redoc', label: 'ReDoc', desc: '参考文档', color: 'emerald' },
          { href: '/openapi.json', label: 'OpenAPI', desc: 'JSON Schema', color: 'violet' },
        ].map((link) => (
          <a key={link.href} href={link.href} target="_blank" className="p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow transition-all">
            <p className="text-xs font-medium text-slate-900">{link.label}</p>
            <p className="text-[10px] text-slate-500">{link.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
