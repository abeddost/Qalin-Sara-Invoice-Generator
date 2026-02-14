import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const AdminLayout = ({ children }) => {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Rechnungen', path: '/dashboard/invoices', icon: '📄' },
    { name: 'Einstellungen', path: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-brand-charcoal">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
              <img src="/logo.png" alt="Qalin Sara" className="h-8 w-8 object-contain" />
              <span className="ml-2 text-white font-semibold">Qalin Sara</span>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              <button
                onClick={signOut}
                className="ml-3 text-gray-400 hover:text-white"
                title="Abmelden"
              >
                🚪
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              ☰
            </button>
            <span className="font-medium">Qalin Sara</span>
            <button onClick={signOut} className="p-2 text-gray-600">Abmelden</button>
          </header>
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md ${location.pathname === item.path ? 'bg-gray-100' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
