import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const { login } = useAuth()

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => login('google')}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <span>Continue with Google</span>
          </button>
          
          <button
            onClick={() => login('github')}
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login