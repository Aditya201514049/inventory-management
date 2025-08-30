import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { User } from '../services/types'
import { authService } from '../services/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
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

  const checkAuth = useCallback(async () => {
    if (loading) return // Prevent multiple calls while loading
    
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [loading])

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
      setLoading(false)
      await authService.logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login'
    }
  }

  // No automatic auth check on mount to prevent loops
  // Auth will be checked manually when needed

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
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