
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listItems, deleteItem } from '../../services/item';
import ItemForm from './ItemForm';
import { toast } from 'react-hot-toast';

type Field = {
  id: string;
  name: string;
  title: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK';
  visible: boolean;
};

export default function ItemsTab({ inventoryId }: { inventoryId: string }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['items', inventoryId, page, search],
    queryFn: () => listItems(inventoryId, { page, limit: 20, search }),
  });

  const items = data?.items ?? [];
  const fields: Field[] = data?.inventory?.fields ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  const del = useMutation({
    mutationFn: (id: string) => {
      console.log('Deleting item with ID:', id); // Debug log
      return deleteItem(id);
    },
    onSuccess: (data, id) => {
      console.log('Successfully deleted item:', id); // Debug log
      setSelected(prev => prev.filter(itemId => itemId !== id));
      qc.invalidateQueries({ queryKey: ['items', inventoryId] });
      toast.success('Item deleted successfully');
    },
    onError: (error: any, id) => {
      console.error('Delete error for item:', id, error); // Debug log
      toast.error(`Failed to delete item: ${error.message || 'Unknown error'}`);
    },
  });

  const columns = useMemo(
    () => [{ key: 'customId', title: 'ID' }, ...fields.filter(f => f.visible).map(f => ({ key: f.name, title: f.title }))],
    [fields]
  );

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (selected.length === 1) {
      const item = items.find((it: any) => it.id === selected[0]);
      setEditingItem(item);
      setShowForm(true);
    }
  };

  const handleDelete = () => {
    if (selected.length === 0) {
      toast.error('Please select items to delete');
      return;
    }

    const confirmMessage = selected.length === 1 
      ? 'Are you sure you want to delete this item?' 
      : `Are you sure you want to delete ${selected.length} items?`;

    if (window.confirm(confirmMessage)) {
      console.log('Deleting selected items:', selected); // Debug log
      selected.forEach(id => {
        del.mutate(id);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleAdd}>
            Add
          </button>
          <button
            className="px-3 py-1 border rounded"
            disabled={selected.length !== 1}
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            className="px-3 py-1 border rounded"
            disabled={!selected.length}
            onClick={handleDelete}
          >
            Delete {selected.length > 0 && `(${selected.length})`}
          </button>
        </div>
        <input
          className="border px-3 py-2 rounded w-full sm:w-64"
          placeholder="Search..."
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
        />
      </div>

      {/* Debug info */}
      {selected.length > 0 && (
        <div className="text-sm text-gray-600">
          Selected: {selected.length} item(s) - {selected.join(', ')}
        </div>
      )}

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">Failed to load items</div>
      ) : (
        <div className="border rounded overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 text-sm font-medium">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={items.length > 0 && selected.length === items.length}
                onChange={e => setSelected(e.target.checked ? items.map((it: any) => it.id) : [])}
              />
            </div>
            {columns.map(col => (
              <div key={col.key} className="col-span-11 sm:col-span-3 md:col-span-2">
                {col.title}
              </div>
            ))}
          </div>

          {items.map((it: any) => (
            <div key={it.id} className="grid grid-cols-12 px-3 py-2 border-t hover:bg-gray-50">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selected.includes(it.id)}
                  onChange={e =>
                    setSelected(e.target.checked ? [...selected, it.id] : selected.filter(id => id !== it.id))
                  }
                />
              </div>
              <div className="col-span-11 grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-3">{it.customId}</div>
                {fields.filter(f => f.visible).map(f => (
                  <div key={f.id} className="col-span-6 sm:col-span-3 md:col-span-2">
                    {String(it.values?.[f.name] ?? '')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2">
          <button className="px-3 py-1 border rounded" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Prev
          </button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button className="px-3 py-1 border rounded" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}

      {/* Item Form Modal */}
      {showForm && (
        <ItemForm
          inventoryId={inventoryId}
          fields={fields}
          initialData={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
