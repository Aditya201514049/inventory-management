import { useEffect } from 'react'
import { authService } from '../services/auth'

const AuthCallback: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      // Store the token and reload the page to ensure clean state
      authService.setToken(token)
      // Remove token from URL and redirect to dashboard
      window.location.replace('/dashboard')
    } else {
      // If token missing, redirect to login
      window.location.replace('/login')
    }
  }, [])

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <span className="ml-2">Processing login...</span>
    </div>
  )
}

export default AuthCallback
