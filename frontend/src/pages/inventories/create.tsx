import InventoryForm from '../../components/inventory/InventoryForm';

const CreateInventoryPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Inventory</h1>
      <InventoryForm />
    </div>
  );
};

export default CreateInventoryPage;