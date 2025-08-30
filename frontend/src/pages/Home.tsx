import { Search, Package, Users, BarChart3 } from 'lucide-react'

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Inventory Management System
        </h1>
        <p className="text-xl text-gray-600">
          Organize, track, and manage your inventory with custom fields and smart ID generation
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search inventories, items, or tags..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Package className="h-12 w-12 text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Custom Fields</h3>
          <p className="text-gray-600">Create flexible inventory templates with custom fields</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <BarChart3 className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Smart IDs</h3>
          <p className="text-gray-600">Generate custom inventory numbers with drag-and-drop builder</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Users className="h-12 w-12 text-purple-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Team Access</h3>
          <p className="text-gray-600">Control who can view and edit your inventories</p>
        </div>
      </div>
    </div>
  )
}

export default Home