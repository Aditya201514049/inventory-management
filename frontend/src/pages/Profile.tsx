import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../services/admin';
import { getUserInventories } from '../services/inventory';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Package, 
  Settings
} from 'lucide-react';


const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventories'>('overview');

  // Get user's detailed stats (reusing admin endpoint but filtered for current user)
  const { data: userStats } = useQuery({
    queryKey: ['user-profile-stats', user?.id],
    queryFn: () => getUsers({ search: user?.email }),
    enabled: !!user?.email
  });

  // Get user's inventories
  const { data: userInventories, error: inventoriesError, isLoading: inventoriesLoading } = useQuery({
    queryKey: ['user-inventories', user?.id],
    queryFn: () => getUserInventories(user?.id),
    enabled: !!user?.id
  });

  // Debug logging
  React.useEffect(() => {
    if (inventoriesError) {
      console.error('Inventories error:', inventoriesError);
    }
    if (userInventories) {
      console.log('User inventories data:', userInventories);
    }
    console.log('Current user:', user);
    console.log('User ID for query:', user?.id);
  }, [inventoriesError, userInventories, user]);

  const currentUserData = userStats?.users?.[0];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name || 'No name set'}
                </h1>
                <div className="flex items-center text-gray-600 mt-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  {user.isAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inventories')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'inventories'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Inventories
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Inventories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentUserData?._count?.inventories || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items Created</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentUserData?._count?.items || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentUserData?._count?.comments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventories' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">My Inventories</h3>
            {inventoriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading inventories...</p>
              </div>
            ) : inventoriesError ? (
              <div className="text-center py-8 text-red-500">
                <p>Error loading inventories: {inventoriesError.message}</p>
              </div>
            ) : userInventories && userInventories.data && userInventories.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userInventories.data.map((inventory) => (
                  <div key={inventory.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 truncate">{inventory.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inventory.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {inventory.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    {inventory.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {inventory.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Created {new Date(inventory.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        Items: {(inventory as any)._count?.items || 0}
                      </span>
                    </div>
                    {inventory.tags && inventory.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {inventory.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {tag}
                          </span>
                        ))}
                        {inventory.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{inventory.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>You haven't created any inventories yet</p>
                <p className="text-sm">Start by creating your first inventory</p>
                <div className="mt-4 text-xs text-gray-400">
                  Debug: {userInventories ? `Data exists, count: ${userInventories.data?.length || 0}` : 'No data'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Account Settings */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {user.name || 'Not set'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {user.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {user.isAdmin ? 'Administrator' : 'Regular User'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
