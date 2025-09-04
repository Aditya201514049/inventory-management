import { Link } from 'react-router-dom';
import { Calendar, User, Eye, Lock } from 'lucide-react';

interface InventoryCardProps {
  inventory: {
    id: string;
    title: string;
    description?: string;
    isPublic: boolean;
    owner: {
      name?: string;
    };
    createdAt: string;
    tags: string[];
  };
}

const InventoryCard = ({ inventory }: InventoryCardProps) => {
  return (
    <Link
      to={`/inventories/${inventory.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{inventory.title}</h3>
        <div className="flex items-center ml-2">
          {inventory.isPublic ? (
            <div title="Public">
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div title="Private">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>
      
      {inventory.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {inventory.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-1" />
          <span>{inventory.owner?.name || 'Unknown User'}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{new Date(inventory.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      {inventory.tags && inventory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {inventory.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
              {tag}
            </span>
          ))}
          {inventory.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              +{inventory.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

export default InventoryCard;