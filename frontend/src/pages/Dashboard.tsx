import { Plus, Package, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2" onClick={() => navigate('/inventories/create')}>
          <Plus className="h-5 w-5" />
          <span>New Inventory</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Inventories</span>
          </h3>
          <p className="text-gray-600 mb-4">Create and manage your inventory templates</p>
          <button className="text-blue-600 hover:text-blue-700" onClick={() => navigate('/inventories')}>View all →</button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Settings className="h-5 w-5 text-green-600" />
            <span>Shared Access</span>
          </h3>
          <p className="text-gray-600 mb-4">Inventories shared with you</p>
          <button className="text-green-600 hover:text-green-700">View all →</button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard