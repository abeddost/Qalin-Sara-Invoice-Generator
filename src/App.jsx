import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { LoginPage } from './pages/LoginPage'
import { InvoicePage } from './pages/InvoicePage'
import { DashboardPage } from './pages/DashboardPage'
import { InvoicesListPage } from './pages/InvoicesListPage'
import { InvoiceEditPage } from './pages/InvoiceEditPage'
import { SettingsPage } from './pages/SettingsPage'

const AdminRedirectWrapper = ({ children }) => {
  const { role, loading } = useAuth()
  if (loading) return null // Parent shows loading
  if (role === 'admin') return <Navigate to="/dashboard" replace />
  return children
}

const RoleBasedRedirect = () => {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/invoice" replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Employee routes - admins get redirected to dashboard */}
          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <AdminRedirectWrapper>
                  <InvoicePage />
                </AdminRedirectWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice/:id"
            element={
              <ProtectedRoute>
                <AdminRedirectWrapper>
                  <InvoicePage />
                </AdminRedirectWrapper>
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DashboardPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/invoices"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <InvoicesListPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/invoices/:id"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <InvoiceEditPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <SettingsPage />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
