import { useAuth } from '../contexts/AuthContext'

export const EmployeeLayout = ({ children }) => {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Qalin Sara Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-semibold text-brand-charcoal">Qalin Sara - Rechnung</h1>
              <p className="text-sm text-gray-600">Rechnungen erstellen</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
