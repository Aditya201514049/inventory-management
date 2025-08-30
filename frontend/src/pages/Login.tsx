import { Github } from 'lucide-react'

const Login = () => {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
        
        <div className="space-y-4">
          <a
            href="/auth/google"
            className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
            <span>Continue with Google</span>
          </a>
          
          <a
            href="/auth/github"
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800"
          >
            <Github className="h-5 w-5" />
            <span>Continue with GitHub</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login