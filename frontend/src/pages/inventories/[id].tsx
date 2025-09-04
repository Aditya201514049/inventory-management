import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import InventoryForm from '../../components/inventory/InventoryForm';
import { getInventory } from '../../services/inventory';
import { Inventory } from '../../types/inventory';
import InventoryTabs from '../../components/inventory/InventoryTabs';
import ItemsTab from '../../components/inventory/ItemsTab';
import FieldsTab from '../../components/inventory/FieldsTab';
import CustomIdTab from '../../components/inventory/CustomIdTab';
import AccessTab from '../../components/inventory/AccessTab';

const InventoryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inventory, isLoading, error } = useQuery<Inventory>({
    queryKey: ['inventory', id],
    queryFn: () => id ? getInventory(id) : Promise.reject('No ID provided'),
    enabled: !!id
  });

  if (isLoading) return <div className="text-gray-600 dark:text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-600 dark:text-red-400">Error loading inventory</div>;
  if (!inventory) return <div className="text-gray-600 dark:text-gray-400">Inventory not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.title}</h1>
        <button type="button" onClick={() => navigate('/inventories')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">Back to List</button>
      </div>

      <InventoryTabs
        tabs={[
          { id: 'fields', label: 'Fields', node: <FieldsTab inventoryId={id!} /> },
          { id: 'items', label: 'Items', node: <ItemsTab inventoryId={id!} /> },
          { id: 'customId', label: 'Custom IDs', node: <CustomIdTab inventoryId={id!} /> },
          { id: 'access', label: 'Access', node: <AccessTab inventoryId={id!} inventory={inventory} /> },
          { id: 'settings', label: 'Settings', node: <InventoryForm initialData={inventory} /> },
        ]}
      />
    </div>
  );
};

export default InventoryDetailPage;