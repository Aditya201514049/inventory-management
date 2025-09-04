import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, LogOut, LogIn } from 'lucide-react'

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
                <Link to="/inventories" className="text-gray-600 hover:text-gray-900">
                  Inventories
                </Link>
                {user?.isAdmin && (
                  <Link to="/admin" className="text-purple-600 hover:text-purple-900 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Welcome, {user?.name || user?.email}
                </Link>
                <button 
                  onClick={logout}
                  className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 flex items-center"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center"
                title="Login"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar