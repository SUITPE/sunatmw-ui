import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './pages/login/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DocumentListPage from './pages/documents/DocumentListPage'
import DocumentDetailPage from './pages/documents/DocumentDetailPage'
import EmitInvoicePage from './pages/emit/EmitInvoicePage'
import EmitReceiptPage from './pages/emit/EmitReceiptPage'
import EmitCreditNotePage from './pages/emit/EmitCreditNotePage'
import EmitDebitNotePage from './pages/emit/EmitDebitNotePage'
import UsersPage from './pages/users/UsersPage'
import ClientsPage from './pages/clients/ClientsPage'
import ProductsPage from './pages/products/ProductsPage'
import ReceivablesPage from './pages/receivables/ReceivablesPage'
import RemindersPage from './pages/reminders/RemindersPage'
import SettingsPage from './pages/settings/SettingsPage'
import OnboardingWizard from './pages/onboarding/OnboardingWizard'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore } from './stores/auth.store'
import { useOnboarding } from './hooks/useOnboarding'

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

function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const { needsOnboarding } = useOnboarding()
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OnboardingRedirect>
        <AppLayout>{children}</AppLayout>
      </OnboardingRedirect>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<AuthenticatedLayout><DashboardPage /></AuthenticatedLayout>} />
          <Route path="/documents" element={<AuthenticatedLayout><DocumentListPage /></AuthenticatedLayout>} />
          <Route path="/documents/:id" element={<AuthenticatedLayout><DocumentDetailPage /></AuthenticatedLayout>} />
          <Route path="/emit" element={<AuthenticatedLayout><EmitInvoicePage /></AuthenticatedLayout>} />
          <Route path="/emit-receipt" element={<AuthenticatedLayout><EmitReceiptPage /></AuthenticatedLayout>} />
          <Route path="/emit-credit-note" element={<AuthenticatedLayout><EmitCreditNotePage /></AuthenticatedLayout>} />
          <Route path="/emit-debit-note" element={<AuthenticatedLayout><EmitDebitNotePage /></AuthenticatedLayout>} />
          <Route path="/users" element={<AuthenticatedLayout><UsersPage /></AuthenticatedLayout>} />
          <Route path="/clients" element={<AuthenticatedLayout><ClientsPage /></AuthenticatedLayout>} />
          <Route path="/products" element={<AuthenticatedLayout><ProductsPage /></AuthenticatedLayout>} />
          <Route path="/receivables" element={<AuthenticatedLayout><ReceivablesPage /></AuthenticatedLayout>} />
          <Route path="/reminders" element={<AuthenticatedLayout><RemindersPage /></AuthenticatedLayout>} />
          <Route path="/settings" element={<AuthenticatedLayout><SettingsPage /></AuthenticatedLayout>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
