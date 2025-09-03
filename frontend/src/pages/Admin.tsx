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
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterBlocked, setFilterBlocked] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', page, search, filterBlocked],
    queryFn: () => getUsers({ page, search, blocked: filterBlocked })
  });

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
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to delete user')
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

  if (statsLoading) {
    return <div className="flex justify-center py-8">Loading admin dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, permissions, and system overview</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inventories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInventories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Ban className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.blockedUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={filterBlocked === undefined ? '' : filterBlocked.toString()}
              onChange={(e) => setFilterBlocked(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="flex justify-center py-8">Loading users...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
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
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{' '}
              {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of{' '}
              {usersData.pagination.total} users
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= usersData.pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
