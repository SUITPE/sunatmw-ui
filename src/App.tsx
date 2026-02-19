import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DocumentListPage from './pages/documents/DocumentListPage'
import DocumentDetailPage from './pages/documents/DocumentDetailPage'
import EmitInvoicePage from './pages/emit/EmitInvoicePage'
import EmitReceiptPage from './pages/emit/EmitReceiptPage'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore } from './stores/auth.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
          <Route path="/documents" element={<AuthenticatedLayout><DocumentListPage /></AuthenticatedLayout>} />
          <Route path="/documents/:id" element={<AuthenticatedLayout><DocumentDetailPage /></AuthenticatedLayout>} />
          <Route path="/emit" element={<AuthenticatedLayout><EmitInvoicePage /></AuthenticatedLayout>} />
          <Route path="/emit-receipt" element={<AuthenticatedLayout><EmitReceiptPage /></AuthenticatedLayout>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
