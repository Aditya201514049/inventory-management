import { Plus, Package, BarChart3, TrendingUp, Eye, Users, Calendar, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getInventories } from '../services/inventory'
import { useEffect } from 'react'

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  // Check authentication status when component mounts (important for OAuth redirects)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Get user's inventories for dashboard stats
  const { data: inventoriesData } = useQuery({
    queryKey: ['dashboard-inventories'],
    queryFn: () => getInventories({ limit: 100 }),
  });

  const totalInventories = inventoriesData?.total || 0;
  const publicInventories = inventoriesData?.data?.filter(inv => inv.isPublic).length || 0;
  const privateInventories = totalInventories - publicInventories;

  const quickActions = [
    {
      title: 'Create New Inventory',
      description: 'Start building your inventory collection',
      icon: Plus,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => navigate('/inventories/create')
    },
    {
      title: 'Browse All Inventories',
      description: 'Explore and manage existing inventories',
      icon: Package,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => navigate('/inventories')
    },
    {
      title: 'View Profile',
      description: 'Check your account and statistics',
      icon: Users,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => navigate('/profile')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-blue-100 dark:text-blue-200 text-lg">
              Ready to manage your inventory collection?
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 text-blue-100 dark:text-blue-200">
            <Calendar className="h-5 w-5" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Inventories</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalInventories}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All your collections</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Public</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{publicInventories}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visible to everyone</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Eye className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Private</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{privateInventories}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personal collections</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${action.color.replace('hover:', '')} text-white`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Getting Started</h2>
          <BarChart3 className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Create your first inventory</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Add items to your inventory</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Share with others</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Tips</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <p>💡 Use tags to organize your inventories</p>
              <p>🔍 Enable full-text search for easy discovery</p>
              <p>🎨 Add images to make your items more visual</p>
              <p>🔒 Control privacy with public/private settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard