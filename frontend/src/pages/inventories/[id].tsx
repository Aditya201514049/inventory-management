import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import InventoryForm from '../../components/inventory/InventoryForm';
import { getInventory } from '../../services/inventory';
import { Inventory } from '../../types/inventory';

const InventoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inventory, isLoading, error } = useQuery<Inventory>({
    queryKey: ['inventory', id],
    queryFn: () => id ? getInventory(id) : Promise.reject('No ID provided'),
    enabled: !!id
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading inventory</div>;
  if (!inventory) return <div>Inventory not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Inventory</h1>
        <button
          type="button"
          onClick={() => navigate('/inventories')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to List
        </button>
      </div>
      <InventoryForm initialData={inventory} />
    </div>
  );
};

export default InventoryDetailPage;