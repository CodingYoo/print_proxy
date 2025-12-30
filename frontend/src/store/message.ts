import { create } from 'zustand'

type MessageType = 'info' | 'success' | 'error'

interface Message {
  id: number
  text: string
  type: MessageType
}

interface MessageState {
  messages: Message[]
  showMessage: (text: string, type?: MessageType) => void
  removeMessage: (id: number) => void
}

let messageId = 0

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],

  showMessage: (text: string, type: MessageType = 'info') => {
    const id = ++messageId
    set((state) => ({
      messages: [...state.messages, { id, text, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
      }))
    }, 4000)
  },

  removeMessage: (id: number) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }))
  },
}))
