
import { useState} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listItems, deleteItem } from '../../services/item';
import { Field } from '../../types/field'; // Import the correct type
import ItemForm from './ItemForm';
import { toast } from 'react-hot-toast';

export default function ItemsTab({ inventoryId }: { inventoryId: string }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', inventoryId, page, search],
    queryFn: () => listItems(inventoryId, { page, limit: 20, search })
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', inventoryId] });
      toast.success('Items deleted successfully');
      setSelectedItems([]);
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete items');
    }
  });

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      await Promise.all(selectedItems.map(id => deleteMutation.mutateAsync(id)));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === data?.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data?.items.map((item: any) => item.id) || []);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
  };

  const handleAddItem = () => {
    setEditingItem({}); // Empty object for new item
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading items</div>;

  const { items, inventory, pagination } = data;
  const fields = inventory?.fields || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete ({selectedItems.length})
            </button>
          )}
          <button
            onClick={handleAddItem}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Item
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === items.length && items.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Custom ID</th>
              {fields.map((field: Field) => (
                <th key={field.id} className="px-4 py-2 text-left font-medium text-gray-700">
                  {field.title}
                </th>
              ))}
              <th className="px-4 py-2 text-left font-medium text-gray-700">Created</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-2 font-mono">{item.customId}</td>
                {fields.map((field: Field) => (
                  <td key={field.id} className="px-4 py-2">
                    {item.values[field.name]?.toString() || '-'}
                  </td>
                ))}
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Item Form Modal */}
      {editingItem !== null && (
        <ItemForm
          inventoryId={inventoryId}
          fields={fields}
          inventory={inventory}
          initialData={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}
