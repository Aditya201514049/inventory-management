import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAdminStats } from '../services/admin';

const DebugAuth = () => {
  const { user, isAuthenticated } = useAuth();
  
  const { data: stats, error: statsError, isLoading } = useQuery({
    queryKey: ['debug-admin-stats'],
    queryFn: getAdminStats,
    retry: false,
    enabled: isAuthenticated && user?.isAdmin
  });

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      
      <div className="space-y-1">
        <div><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
        <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</div>
        <div><strong>Is Admin:</strong> {user?.isAdmin ? '✅ Yes' : '❌ No'}</div>
        
        {user?.isAdmin && (
          <>
            <div><strong>Stats Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Stats Error:</strong> {statsError ? JSON.stringify(statsError, null, 2) : 'None'}</div>
            <div><strong>Stats Data:</strong> {stats ? JSON.stringify(stats, null, 2) : 'None'}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebugAuth;
