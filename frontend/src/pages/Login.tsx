import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useMessageStore } from '@/store'
import { Input, Button } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { showMessage } = useMessageStore()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password, remember)
      navigate('/dashboard')
    } catch (err) {
      showMessage(err instanceof Error ? err.message : '登录失败，请检查账号或密码', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `radial-gradient(circle at 20% 20%, rgba(59,130,246,0.25), transparent 40%),
                     radial-gradient(circle at 80% 30%, rgba(14,165,233,0.2), transparent 45%),
                     radial-gradient(circle at 50% 80%, rgba(34,197,94,0.2), transparent 50%),
                     #0f172a`,
      }}
    >
      <div className="max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-100 text-blue-600 text-3xl font-bold mb-4">
            P
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">PrintProxy</h1>
          <p className="text-slate-500 mt-2">统一打印代理控制台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="用户名"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="输入用户名"
            required
          />

          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            required
          />

          <div className="flex items-center justify-between text-sm text-slate-500">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2">保持登录状态</span>
            </label>
            <button
              type="button"
              className="hover:text-blue-600 transition"
              onClick={() => alert('请联系管理员重置密码或生成新的访问凭证。')}
            >
              忘记密码?
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            立即登录
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          如未配置账号，请联系系统管理员开通访问权限。
        </div>
      </div>
    </div>
  )
}
