import { useMessageStore } from '@/store'

const typeStyles = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function MessageContainer() {
  const { messages, removeMessage } = useMessageStore()

  if (messages.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border shadow-lg min-w-[280px] ${typeStyles[msg.type]}`}
        >
          <span className="text-sm">{msg.text}</span>
          <button onClick={() => removeMessage(msg.id)} className="ml-4 opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
