import api from './api'
import { User } from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const authService = {
  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const response = await api.get('/profile')
      return response.data.user
    } catch (error) {
      return null
    }
  },

  // Login with Google
  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google`
  },

  // Login with GitHub
  loginWithGitHub: () => {
    window.location.href = `${API_URL}/auth/github`
  },

  // Logout
  logout: async () => {
    try {
      await api.get('/auth/logout')
      // Don't redirect here - let the frontend handle it
    } catch (error) {
      console.error('Logout error:', error)
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
  }
}