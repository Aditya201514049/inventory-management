import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      authService.loginWithGoogle()
    } else {
      authService.loginWithGitHub()
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      // No need to redirect - backend will handle it
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

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