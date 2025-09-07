import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUserInventories, deleteInventory } from '../services/inventory';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Lock,
  Search,
  Filter,
  User
} from 'lucide-react';

const MyInventories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  const { data: inventoriesData, isLoading, error } = useQuery({
    queryKey: ['user-inventories', user?.id],
    queryFn: () => getUserInventories(),
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-inventories'] });
      toast.success('Inventory deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete inventory');
    }
  });

  const handleDelete = (inventoryId: string, inventoryTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${inventoryTitle}"? This action cannot be undone.`)) {
      deleteMutation.mutate(inventoryId);
    }
  };

  const filteredInventories = inventoriesData?.data?.filter(inventory => {
    const matchesSearch = inventory.title.toLowerCase().includes(search.toLowerCase()) ||
                         inventory.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'public' && inventory.isPublic) ||
                         (filter === 'private' && !inventory.isPublic);
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (isLoading) return <div className="text-gray-600 dark:text-gray-400">Loading your inventories...</div>;
  if (error) return <div className="text-red-600 dark:text-red-400">Error loading inventories</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Inventories</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all your inventories - {inventoriesData?.total || 0} total
          </p>
        </div>
        <button
          onClick={() => navigate('/inventories/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Inventory</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search inventories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'public' | 'private')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Inventories</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>

      {/* Inventories Grid */}
      {filteredInventories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventories.map((inventory) => (
            <div key={inventory.id} className="border dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{inventory.title}</h3>
                <div className="flex items-center ml-2 space-x-2">
                  {/* Ownership indicator */}
                  {inventory.ownerId === user?.id ? (
                    <div title="You own this inventory" className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">Owner</span>
                    </div>
                  ) : (
                    <div title="Shared with you" className="flex items-center space-x-1">
                      <Package className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400">Shared</span>
                    </div>
                  )}
                  
                  {/* Public/Private indicator */}
                  {inventory.isPublic ? (
                    <div title="Public" className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400">Public</span>
                    </div>
                  ) : (
                    <div title="Private" className="flex items-center space-x-1">
                      <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Private</span>
                    </div>
                  )}
                </div>
              </div>

              {inventory.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {inventory.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>{((inventory as any)._count?.items || 0)} items</span>
                <span>{new Date(inventory.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => navigate(`/inventories/${inventory.id}`)}
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(inventory.id, inventory.title)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {search || filter !== 'all' ? 'No matching inventories' : 'No inventories yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {search || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first inventory to get started'
            }
          </p>
          {!search && filter === 'all' && (
            <button
              onClick={() => navigate('/inventories/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center space-x-2 mx-auto transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Inventory</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MyInventories;
