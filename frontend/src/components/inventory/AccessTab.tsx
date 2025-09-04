import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inventory } from '../../types/inventory';
import { getInventoryAccess, addUserAccess, removeUserAccess, updateInventoryAccess } from '../../services/access';
import UserAutocomplete from './UserAutocomplete';
import { Trash2, Users, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [sortBy, setSortBy] = useState<'name' | 'email'>('name');
  const [isPublic, setIsPublic] = useState(inventory.isPublic);

  // Fetch access list
  const { data: accessList = [], isLoading } = useQuery<AccessUser[]>({
    queryKey: ['inventory-access', inventoryId],
    queryFn: () => getInventoryAccess(inventoryId)
  });

  // Toggle public/private
  const togglePublicMutation = useMutation({
    mutationFn: (newIsPublic: boolean) => 
      updateInventoryAccess(inventoryId, { isPublic: newIsPublic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', inventoryId] });
      toast.success(isPublic ? 'Inventory is now private' : 'Inventory is now public');
    },
    onError: () => {
      toast.error('Failed to update inventory access');
    }
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: (userId: string) => addUserAccess(inventoryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-access', inventoryId] });
      toast.success('User added successfully');
    },
    onError: () => {
      toast.error('Failed to add user');
    }
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => removeUserAccess(inventoryId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-access', inventoryId] });
      toast.success('User removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove user');
    }
  });

  const handleTogglePublic = () => {
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    togglePublicMutation.mutate(newIsPublic);
  };

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

  if (isLoading) {
    return <div className="flex justify-center py-8 text-gray-600 dark:text-gray-400">Loading access settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Public/Private Toggle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isPublic ? <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" /> : <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isPublic ? 'Public Inventory' : 'Private Inventory'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isPublic 
                  ? 'Any authenticated user can add and edit items'
                  : 'Only users with explicit access can add and edit items'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePublic}
            disabled={togglePublicMutation.isPending}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
              isPublic
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {togglePublicMutation.isPending ? 'Updating...' : (isPublic ? 'Make Private' : 'Make Public')}
          </button>
        </div>
      </div>

      {/* User Access Management */}
      {!isPublic && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Access</h3>
          </div>

          {/* Add User */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add User by Name or Email
            </label>
            <UserAutocomplete
              onSelectUser={handleAddUser}
              excludeUserIds={accessList.map(access => access.userId)}
              placeholder="Search users by name or email..."
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'name'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Name
            </button>
            <button
              onClick={() => setSortBy('email')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'email'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Email
            </button>
          </div>

          {/* Access List */}
          <div className="space-y-2">
            {sortedAccessList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No users have access to this inventory
              </p>
            ) : (
              sortedAccessList.map((access) => (
                <div
                  key={access.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {access.user.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {access.user.email}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(access.userId)}
                    disabled={removeUserMutation.isPending}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
                    title="Remove access"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessTab;
