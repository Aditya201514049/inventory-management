import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      // Store the token in localStorage
      authService.handleOAuthCallback(token)

      // Navigate to dashboard without full reload
      navigate('/dashboard', { replace: true })
    } else {
      // If token missing, redirect to login
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return <div>Processing login...</div>
}

export default AuthCallback
