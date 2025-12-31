
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useMessageStore } from '@/store'
import { Input, Button, Card } from '@/components/ui'

export default function LoginPage() {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px] z-10 transition-all duration-700 animate-in fade-in zoom-in-95">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="PrintProxy Logo" className="mx-auto block h-24 w-24 mb-6 transform transition-transform hover:scale-110 duration-300 rounded-2xl shadow-lg shadow-indigo-200 bg-white" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">欢迎回来</h1>
          <p className="text-slate-500 text-sm mt-2">请登录 PrintProxy 控制台以继续</p>
        </div>

        <Card className="shadow-xl shadow-slate-200/50 border-slate-100" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="用户名"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                fullWidth
              />
              <div className="space-y-1">
                <Input
                  label="密码"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  fullWidth
                />
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-700" onClick={() => showMessage('请联系管理员重置密码', 'info')}>
                    忘记密码?
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-slate-600 cursor-pointer select-none">
                30天内保持登录
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-base py-6 shadow-md shadow-indigo-200"
              loading={loading}
              size="lg"
            >
              登 录
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2025 PrintProxy System. All rights reserved.
        </p>
      </div>
    </div>
  )
}
