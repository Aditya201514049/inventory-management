import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inventory } from '../../types/inventory';
import { getInventoryAccess, addUserAccess, removeUserAccess } from '../../services/access';
import UserAutocomplete from './UserAutocomplete';
import { Trash2, Users, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface AccessTabProps {
  inventoryId: string;
  inventory: Inventory;
}

interface AccessUser {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  canWrite: boolean;
}

const AccessTab: React.FC<AccessTabProps> = ({ inventoryId, inventory }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name');

  // Early return if user is not loaded
  if (!user) {
    return <div className="text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  // Fetch access list only if user is the owner
  const { data: accessList = [], isLoading } = useQuery<AccessUser[]>({
    queryKey: ['inventory-access', inventoryId],
    queryFn: () => getInventoryAccess(inventoryId),
    enabled: inventory.ownerId === user.id, // Only fetch if user is owner
    retry: false // Don't retry on 403 errors
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userId: string) => addUserAccess(inventoryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-access', inventoryId] });
      toast.success('User added successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add user';
      toast.error(message);
    }
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => removeUserAccess(inventoryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-access', inventoryId] });
      toast.success('User removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to remove user';
      toast.error(message);
    }
  });

  const handleAddUser = (userId: string) => {
    addUserMutation.mutate(userId);
  };

  const handleRemoveUser = (userId: string) => {
    removeUserMutation.mutate(userId);
  };

  // Sort access list
  const sortedAccessList = [...accessList].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.user.name || '').localeCompare(b.user.name || '');
    }
    return a.user.email.localeCompare(b.user.email);
  });

  return (
    <div className="space-y-6">
      {/* User Access Management - Show for inventory owners */}
      {inventory.ownerId === user.id ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Access Management</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Grant specific users access to view and edit this inventory.
          </p>

          <UserAutocomplete
            onSelectUser={handleAddUser}
            placeholder="Add user by email..."
          />

          {isLoading ? (
            <div className="text-gray-500 dark:text-gray-400 mt-4">Loading users...</div>
          ) : accessList.length > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {accessList.length} user{accessList.length !== 1 ? 's' : ''} with access
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'email')}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                </select>
              </div>
              
              <div className="space-y-2">
                {sortedAccessList.map((access) => (
                  <div key={access.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {access.user.name ? access.user.name.charAt(0).toUpperCase() : access.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {access.user.name || access.user.email}
                        </p>
                        {access.user.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{access.user.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(access.userId)}
                      disabled={removeUserMutation.isPending}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                      title="Remove access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
              No users have been granted access to this inventory.
            </div>
          )}
        </div>
      ) : (
        /* Information for shared users */
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                Shared Inventory Access
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                This inventory has been shared with you by the owner. 
                You can view and edit items, but only the owner can manage access permissions for other users.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessTab;
