import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth()

  // Don't redirect while still loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Simple redirect without useEffect
  if (isAuthenticated) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border dark:border-gray-700">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Sign In</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => login('google')}
            className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <span>Continue with Google</span>
          </button>
          
          <button
            onClick={() => login('github')}
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 dark:bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors"
          >
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login