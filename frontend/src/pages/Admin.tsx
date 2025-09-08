import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAdminStats, 
  getUsers, 
  promoteUser, 
  demoteUser, 
  blockUser, 
  unblockUser, 
  deleteUser,
  AdminUser 
} from '../services/admin';
import { getAdminInventories, deleteInventory } from '../services/inventory';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  Ban, 
  Trash2, 
  Search, 
  UserPlus, 
  UserMinus,
  AlertTriangle,
  Package,
  MessageSquare,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'inventories'>('overview');
  const [search, setSearch] = useState('');
  const [filterBlocked, setFilterBlocked] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Inventory management states
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    retry: 1
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users', page, search, filterBlocked],
    queryFn: () => getUsers({ page, search, blocked: filterBlocked }),
    retry: 1,
    enabled: activeTab === 'users'
  });

  // Fetch inventories for admin view
  const { data: inventoriesData, isLoading: inventoriesLoading, error: inventoriesError } = useQuery({
    queryKey: ['admin-inventories', inventoryPage, inventorySearch],
    queryFn: () => getAdminInventories({ 
      page: inventoryPage, 
      limit: itemsPerPage, 
      search: inventorySearch 
    }),
    retry: 1,
    enabled: activeTab === 'inventories'
  });

  // Handle errors with useEffect
  React.useEffect(() => {
    if (statsError) {
      console.error('Stats error:', statsError);
      toast.error('Failed to load admin statistics');
    }
  }, [statsError]);

  React.useEffect(() => {
    if (usersError) {
      console.error('Users error:', usersError);
      toast.error('Failed to load users');
    }
  }, [usersError]);

  React.useEffect(() => {
    if (inventoriesError) {
      console.error('Inventories error:', inventoriesError);
      toast.error('Failed to load inventories');
    }
  }, [inventoriesError]);

  // Mutations
  const promoteMutation = useMutation({
    mutationFn: promoteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User promoted to admin');
    },
    onError: () => toast.error('Failed to promote user')
  });

  const demoteMutation = useMutation({
    mutationFn: demoteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Admin demoted to user');
    },
    onError: () => toast.error('Failed to demote admin')
  });

  const blockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User blocked');
    },
    onError: () => toast.error('Failed to block user')
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User unblocked');
    },
    onError: () => toast.error('Failed to unblock user')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Failed to delete user')
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Inventory deleted');
    },
    onError: () => toast.error('Failed to delete inventory')
  });

  const handleAction = (action: string, user: AdminUser) => {
    const confirmMessage = {
      promote: `Promote ${user.name || user.email} to admin?`,
      demote: `Demote ${user.name || user.email} from admin?`,
      block: `Block ${user.name || user.email}?`,
      unblock: `Unblock ${user.name || user.email}?`,
      delete: `Delete ${user.name || user.email}? This action cannot be undone.`
    }[action];

    if (window.confirm(confirmMessage)) {
      switch (action) {
        case 'promote':
          promoteMutation.mutate(user.id);
          break;
        case 'demote':
          demoteMutation.mutate(user.id);
          break;
        case 'block':
          blockMutation.mutate(user.id);
          break;
        case 'unblock':
          unblockMutation.mutate(user.id);
          break;
        case 'delete':
          deleteMutation.mutate(user.id);
          break;
      }
    }
  };

  const handleInventoryDelete = (inventoryId: string, inventoryName: string) => {
    if (window.confirm(`Delete inventory "${inventoryName}"? This action cannot be undone.`)) {
      deleteInventoryMutation.mutate(inventoryId);
    }
  };

  if (statsLoading) {
    return <div className="flex justify-center py-8">Loading admin dashboard...</div>;
  }

  if (statsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Admin Access Error</h2>
          <p className="text-red-700">
            Unable to load admin dashboard. Please ensure you are logged in as an admin user.
          </p>
          <p className="text-sm text-red-600 mt-2">
            Error: {statsError?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage users, permissions, and system overview</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inventories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInventories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blocked</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.blockedUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`text-sm font-medium ${activeTab === 'users' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('inventories')}
          className={`text-sm font-medium ${activeTab === 'inventories' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`}
        >
          Inventories
        </button>
      </div>

      {/* User Management */}
      {activeTab === 'users' && (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">User Management</h2>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterBlocked === undefined ? '' : filterBlocked.toString()}
              onChange={(e) => setFilterBlocked(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              <option value="false">Active Users</option>
              <option value="true">Blocked Users</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="flex justify-center py-8 text-gray-600 dark:text-gray-400">Loading users...</div>
          ) : usersError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
              <p className="text-red-700 dark:text-red-400">Failed to load users: {usersError?.message || 'Unknown error'}</p>
            </div>
          ) : !usersData || !('users' in usersData) || !usersData.users?.length ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {usersData?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isAdmin 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {user.isAdmin ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 mr-1" />
                            User
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.blocked 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {user.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        {user._count.inventories} inventories, {user._count.items} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!user.isAdmin ? (
                          <button
                            onClick={() => handleAction('promote', user)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Promote to Admin"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('demote', user)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Demote from Admin"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                        
                        {!user.blocked ? (
                          <button
                            onClick={() => handleAction('block', user)}
                            className="text-red-600 hover:text-red-900"
                            title="Block User"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('unblock', user)}
                            className="text-green-600 hover:text-green-900"
                            title="Unblock User"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleAction('delete', user)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {usersData?.pagination && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{' '}
              {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of{' '}
              {usersData.pagination.total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= usersData.pagination.pages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Inventory Management */}
      {activeTab === 'inventories' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Inventory Management</h2>
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search inventories..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Inventories Table */}
          <div className="overflow-x-auto">
            {inventoriesLoading ? (
              <div className="flex justify-center py-8 text-gray-600 dark:text-gray-400">Loading inventories...</div>
            ) : inventoriesError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
                <p className="text-red-700 dark:text-red-400">Failed to load inventories: {inventoriesError?.message || 'Unknown error'}</p>
              </div>
            ) : !inventoriesData || !inventoriesData.data?.length ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No inventories found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Inventory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {inventoriesData?.data.map((inventory: any) => (
                    <tr key={inventory.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {inventory.title}
                          </div>
                          {inventory.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {inventory.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {inventory.owner?.name || 'No name'}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {inventory.owner?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inventory.isPublic 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {inventory.isPublic ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          {inventory._count?.items || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/inventories/${inventory.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Inventory"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleInventoryDelete(inventory.id, inventory.title)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Inventory"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {inventoriesData && inventoriesData.total > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((inventoriesData.page - 1) * inventoriesData.limit) + 1} to{' '}
                {Math.min(inventoriesData.page * inventoriesData.limit, inventoriesData.total)} of{' '}
                {inventoriesData.total} inventories
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setInventoryPage(inventoryPage - 1)}
                  disabled={inventoryPage <= 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setInventoryPage(inventoryPage + 1)}
                  disabled={inventoryPage >= inventoriesData.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Admin Privileges Notice
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              As an admin, you can promote/demote users, block/unblock accounts, and delete users. 
              You can even remove your own admin privileges. Use these powers responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
