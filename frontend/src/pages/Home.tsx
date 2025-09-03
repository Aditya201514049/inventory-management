import { Search, Package, Users, BarChart3, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Link, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInventories } from '../services/inventory'
import InventoryCard from '../components/inventory/InventoryCard'

const Home = () => {
  const { isAuthenticated, loading } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Auth state is managed by AuthProvider globally

  // Fetch public inventories for non-authenticated users, all accessible for authenticated
  const { data: inventoriesData, isLoading } = useQuery({
    queryKey: ['public-inventories', searchTerm],
    queryFn: () => getInventories({ search: searchTerm, limit: 12 }),
    enabled: true // Always enabled, backend handles access control
  })
  
  // Show loading only if explicitly loading auth
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const inventories = inventoriesData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Inventory Management
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Organize, track, and manage your inventory with ease. Create detailed catalogs, collaborate with your team, and keep everything in one place.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Login to Create
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search public inventories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Public Inventories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Public Inventories</h2>
          <p className="text-gray-600 mt-2">Browse inventories shared by the community</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : inventories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventories.map((inventory: any) => (
              <InventoryCard key={inventory.id} inventory={inventory} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No inventories found matching your search.' : 'No public inventories available yet.'}
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Login to Create the First One
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Organize Inventory</h3>
            <p className="mt-2 text-base text-gray-500">
              Create detailed inventories with custom fields, categories, and tags to keep everything organized.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Team Collaboration</h3>
            <p className="mt-2 text-base text-gray-500">
              Share inventories with your team, manage permissions, and collaborate in real-time.
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Analytics & Reports</h3>
            <p className="mt-2 text-base text-gray-500">
              Get insights into your inventory with detailed analytics and customizable reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home