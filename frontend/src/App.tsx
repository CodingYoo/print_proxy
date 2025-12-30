import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { MessageContainer } from '@/components/Message'
import { useAuthStore } from '@/store'
import './index.css'

export default function App() {
  const { checkAuth, fetchUser } = useAuthStore()

  useEffect(() => {
    if (checkAuth()) {
      fetchUser()
    }
  }, [checkAuth, fetchUser])

  return (
    <>
      <RouterProvider router={router} />
      <MessageContainer />
    </>
  )
}
