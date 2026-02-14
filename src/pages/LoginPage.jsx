import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else if (isSignUp) {
      setSuccessMessage('Konto erstellt! Bitte prüfen Sie Ihre E-Mail zur Bestätigung (falls aktiviert).')
      setLoading(false)
      setTimeout(() => navigate('/'), 2000)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-teal to-brand-charcoal flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Qalin Sara" className="h-16 w-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-brand-charcoal">Qalin Sara</h1>
          <p className="text-gray-600 mt-2">Rechnung Generator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              placeholder="ihre@email.de"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-teal hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isSignUp ? 'Wird erstellt...' : 'Anmelden...') : (isSignUp ? 'Registrieren' : 'Anmelden')}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            {isSignUp ? (
              <>Bereits Konto? <button type="button" onClick={() => setIsSignUp(false)} className="text-brand-teal hover:underline">Anmelden</button></>
            ) : (
              <>Kein Konto? <button type="button" onClick={() => setIsSignUp(true)} className="text-brand-teal hover:underline">Registrieren</button></>
            )}
          </p>
        </form>
      </div>
    </div>
  )
}
