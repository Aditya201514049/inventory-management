import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900">
             Inventory Manager
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/inventories" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Inventories
                  </Link>
                  {user?.isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center px-3 py-2 text-purple-600 hover:text-purple-900 hover:bg-gray-50 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    Profile ({user?.name || user?.email})
                  </Link>
                  <button 
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                  onClick={closeMobileMenu}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar