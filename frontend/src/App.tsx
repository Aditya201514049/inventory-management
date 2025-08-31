import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
// Import the new inventory pages
import InventoriesPage from './pages/inventories';
import CreateInventoryPage from './pages/inventories/create';
import InventoryDetailPage from './pages/inventories/[id]';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Toaster position="top-right" />
            <main className="py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Inventory Routes */}
                  <Route path="/inventories" element={<InventoriesPage />} />
                  <Route path="/inventories/create" element={<CreateInventoryPage />} />
                  <Route path="/inventories/:id" element={<InventoryDetailPage />} />
                </Route>
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;