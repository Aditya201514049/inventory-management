import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { User } from '../services/types'
import { authService } from '../services/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  initialized: boolean
  isAuthenticated: boolean
  login: (provider: 'google' | 'github') => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
  
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const checkAuth = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
      // Clear invalid token
      authService.removeToken()
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  // Initialize authentication state on app startup - but only if there's a token
  useEffect(() => {
    const token = authService.getToken()
    if (token) {
      checkAuth()
    } else {
      setInitialized(true)
    }
  }, [checkAuth])

  const login = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      authService.loginWithGoogle()
    } else {
      authService.loginWithGitHub()
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      await authService.logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    isAuthenticated: !!user && initialized,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}