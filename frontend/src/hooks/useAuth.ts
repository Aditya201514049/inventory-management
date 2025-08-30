import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService } from '../services/auth'
import { User } from '../services/types'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (!isLoading) {
      setUser(currentUser || null)
      setLoading(false)
    }
  }, [currentUser, isLoading])

  const login = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      authService.loginWithGoogle()
    } else {
      authService.loginWithGitHub()
    }
  }

  const logout = () => {
    authService.logout()
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  }
}