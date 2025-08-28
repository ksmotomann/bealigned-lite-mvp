import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/contexts/SessionContext'

export default function AccessGate() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useSession()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('Form submitted with password:', password.length, 'characters')
    
    const result = await login(password)
    console.log('Login result:', result)
    
    if (result.success) {
      navigate('/reflection')
    } else {
      setError(result.error || 'Invalid password')
      setLoading(false)
    }
  }

  const testConnection = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      alert('Environment variables not set!')
      return
    }
    
    try {
      const response = await fetch(`${url}/functions/v1/mvp-password-gate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ password: 'test' }),
      })
      
      const data = await response.json()
      alert(`Test response: ${response.status} - ${JSON.stringify(data)}`)
    } catch (err: any) {
      alert(`Test failed: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">BeAligned Lite</h1>
          <p className="mt-2 text-gray-600">
            Co-parenting communication support
          </p>
        </div>

        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Access Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-2 px-4"
          >
            {loading ? 'Accessing...' : 'Access'}
          </button>
          
          <button
            type="button"
            onClick={testConnection}
            className="w-full btn btn-secondary py-2 px-4 text-xs"
          >
            Test Connection
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>This is a beta version for authorized users only.</p>
          <p className="mt-2">
            <a href="/debug" className="text-blue-600 hover:text-blue-800">
              Debug Page →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}