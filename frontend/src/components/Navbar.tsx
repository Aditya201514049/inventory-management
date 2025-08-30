import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
             Inventory Manager
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <span className="text-gray-600">
                  Welcome, {user?.name || user?.email}
                </span>
                <button 
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar