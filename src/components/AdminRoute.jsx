import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const AdminRoute = ({ children }) => {
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

  if (role !== 'admin') {
    return <Navigate to="/invoice" replace />
  }

  return children
}
