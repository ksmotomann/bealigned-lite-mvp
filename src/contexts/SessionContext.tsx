import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface SessionContextType {
  sessionId: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('session='))
        ?.split('=')[1]

      if (sessionCookie) {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionCookie)
          .single()

        if (data && new Date(data.expires_at) > new Date()) {
          setSessionId(data.id)
        } else {
          setSessionId(null)
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (password: string) => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      console.log('Login attempt:')
      console.log('URL:', url)
      console.log('Key present:', !!key)
      console.log('Password length:', password.length)
      
      if (!url || !key) {
        console.error('Missing environment variables')
        return { success: false, error: 'Configuration error - missing env vars' }
      }
      
      const fullUrl = `${url}/functions/v1/mvp-password-gate`
      console.log('Calling:', fullUrl)
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        // Remove credentials: 'include' to avoid CORS issues
        body: JSON.stringify({ password }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (response.ok && data.success) {
        setSessionId(data.sessionId)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Invalid password' }
      }
    } catch (error) {
      console.error('Login error details:', error)
      return { success: false, error: 'Connection error' }
    }
  }

  const logout = async () => {
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setSessionId(null)
  }

  return (
    <SessionContext.Provider 
      value={{ 
        sessionId, 
        isAuthenticated: !!sessionId,
        loading,
        login, 
        logout 
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}