import { useMessageStore } from '@/store'

const typeConfig = {
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  error: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' },
}

export function MessageContainer() {
  const { messages, removeMessage } = useMessageStore()

  if (messages.length === 0) return null

  return (
    <div className="fixed top-3 right-3 z-50 space-y-2 max-w-xs">
      {messages.map((msg) => {
        const config = typeConfig[msg.type]
        return (
          <div key={msg.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border shadow-lg ${config.bg}`}>
            <p className={`text-xs font-medium ${config.text}`}>{msg.text}</p>
            <button onClick={() => removeMessage(msg.id)} className={`ml-2 ${config.text} opacity-60 hover:opacity-100`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
