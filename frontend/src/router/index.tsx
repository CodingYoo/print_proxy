import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout'
import { LoginPage, OverviewPage, PrintersPage, JobsPage, LogsPage, ApiDocsPage } from '@/pages'
import { getToken } from '@/api'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  if (getToken()) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'printers', element: <PrintersPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'api', element: <ApiDocsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
