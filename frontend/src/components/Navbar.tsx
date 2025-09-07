import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Shield, LogOut, LogIn, Menu, X, Sun, Moon, Home, Package, User, FolderOpen } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
             Inventory Manager
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Home className="h-5 w-5 mr-1" />
                  Dashboard
                </Link>
                <Link to="/inventories" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <Package className="h-5 w-5 mr-1" />
                  Inventories
                </Link>
                <Link to="/my-inventories" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <FolderOpen className="h-5 w-5 mr-1" />
                  My Inventories
                </Link>
                {user?.isAdmin && (
                  <Link to="/admin" className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <Link 
                  to="/profile" 
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:underline"
                >
                  <User className="h-5 w-5 mr-1" />
                   {user?.name || user?.email}
                </Link>
                <button 
                  onClick={logout}
                  className="bg-red-600 dark:bg-red-700 text-white px-3 py-2 rounded-md hover:bg-red-700 dark:hover:bg-red-600 flex items-center"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center"
                title="Login"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/inventories" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Inventories
                  </Link>
                  <Link 
                    to="/my-inventories" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <FolderOpen className="h-5 w-5 mr-2" />
                    My Inventories
                  </Link>
                  {user?.isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center px-3 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={closeMobileMenu}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="block px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Profile ({user?.name || user?.email})
                  </Link>
                  <button 
                    onClick={() => {
                      logout()
                      closeMobileMenu()
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center px-3 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
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