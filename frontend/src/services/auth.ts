import api from './api'
import { User } from './types'

export const authService = {
  // Get JWT token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('jwt_token')
  },

  // Set JWT token in localStorage
  setToken: (token: string): void => {
    localStorage.setItem('jwt_token', token)
  },

  // Remove JWT token from localStorage
  removeToken: (): void => {
    localStorage.removeItem('jwt_token')
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = authService.getToken()
      if (!token) return null
      
      const response = await api.get('/profile')
      return response.data.user
    } catch (error) {
      // If token is invalid, remove it
      authService.removeToken()
      return null
    }
  },

  // Login with Google
  loginWithGoogle: () => {
    // Use environment-aware URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    window.location.href = `${backendUrl}/auth/google`;
  },

  // Login with GitHub
  loginWithGitHub: () => {
    // Use environment-aware URL  
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    window.location.href = `${backendUrl}/auth/github`;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always remove token on logout
      authService.removeToken()
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const user = await authService.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  },

  // Handle OAuth callback with token
  handleOAuthCallback: (token: string): void => {
    authService.setToken(token)
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname)
    // Reload the app so AuthProvider runs checkAuth
    window.location.reload()
  }
  
}
