import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Inventory } from '../../types/inventory';
import { getInventoryAccess, addUserAccess, removeUserAccess, updateInventoryAccess } from '../../services/access';
import UserAutocomplete from './UserAutocomplete';
import { Trash2, Users, Lock, Unlock, Info } from 'lucide-react';
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
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update inventory access';
      toast.error(message);
    }
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
      {!isPublic && user && inventory.ownerId === user.id && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Access</h3>
          </div>

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
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                </select>
              </div>
              <div className="space-y-2">
                {sortedAccessList.map((access) => (
                  <div key={access.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {access.user.name || access.user.email}
                      </div>
                      {access.user.name && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {access.user.email}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveUser(access.userId)}
                      disabled={removeUserMutation.isPending}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded disabled:opacity-50"
                      title="Remove access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 mt-4">
              No users have been granted access to this inventory.
            </div>
          )}
        </div>
      )}

      {/* Information for shared users */}
      {!isPublic && inventory.ownerId !== user?.id && (
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
