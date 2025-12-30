import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useMessageStore } from '@/store'

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
      showMessage(err instanceof Error ? err.message : '登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500 text-white text-xl font-bold mb-3">
              P
            </div>
            <h1 className="text-xl font-bold text-white">PrintProxy</h1>
            <p className="text-slate-500 text-xs mt-1">统一打印代理控制台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-600 bg-white/5 text-blue-500 mr-1.5"
                />
                保持登录
              </label>
              <button type="button" className="text-slate-500 hover:text-blue-400" onClick={() => alert('请联系管理员')}>
                忘记密码?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : '登录'}
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] text-slate-600">
            如未配置账号，请联系管理员开通
          </p>
        </div>
      </div>
    </div>
  )
}
