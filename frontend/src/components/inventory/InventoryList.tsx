import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { deleteInventory } from '../../services/inventory';
import { Link } from 'react-router-dom';
import { getInventories } from '../../services/inventory';
import type { Inventory, PaginatedResponse } from '../../types/inventory';

const InventoryList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<PaginatedResponse<Inventory>, Error>({
    queryKey: ['inventories', currentPage, pageSize],
    queryFn: () => getInventories({ page: currentPage, limit: pageSize })
  });

  // Debug: log what data is coming from backend
  console.log('InventoryList data:', data);
  console.log('isLoading:', isLoading, 'error:', error);

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: () => {
      toast.success('Inventory deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      setDeletingId(null);
    },
    onError: (error: Error) => {
      toast.error(`Error deleting inventory: ${error.message}`);
      setDeletingId(null);
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory? This action cannot be undone.')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  if (isLoading) return <div>Loading inventories...</div>;
  if (error) return <div>Error loading inventories: {error.message}</div>;
  if (!data?.data?.length) return <div>No inventories found</div>;

  // Error boundary for rendering
  try {
    // ...rest of component
  } catch (err) {
    return <div className="text-red-600">An error occurred: {String(err)}</div>;
  }
  
  const { data: inventories, total, totalPages = 1 } = data;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventories</h2>
        <Link
          to="/inventories/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          data-testid="create-inventory-link"
        >
          Create New Inventory
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventories.map((inventory) => (
          <div key={inventory.id} className="group relative p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <Link to={`/inventories/${inventory.id}`} className="flex-1">
                <h3 className="text-lg font-semibold">{inventory.title}</h3>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(inventory.id);
                }}
                disabled={deletingId === inventory.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete inventory"
              >
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Delete</span>
              </button>
            </div>
            <p className="text-gray-600 line-clamp-2">{inventory.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {inventory.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-gray-600">
            Showing {inventories.length} of {total} items
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {(() => {
                const pageNumbers: (number | '...')[] = [];
                
                // Always show first page
                pageNumbers.push(1);
                
                // Calculate range around current page
                let startPage = Math.max(2, currentPage - 1);
                let endPage = Math.min(totalPages - 1, currentPage + 1);
                
                // Adjust if we're near the start
                if (currentPage <= 3) {
                  endPage = Math.min(4, totalPages - 1);
                }
                
                // Adjust if we're near the end
                if (currentPage >= totalPages - 2) {
                  startPage = Math.max(2, totalPages - 3);
                }
                
                // Add ellipsis after first page if needed
                if (startPage > 2) {
                  pageNumbers.push('...');
                }
                
                // Add middle pages
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
                
                // Add ellipsis before last page if needed
                if (endPage < totalPages - 1) {
                  pageNumbers.push('...');
                }
                
                // Always show last page if there is more than one page
                if (totalPages > 1) {
                  pageNumbers.push(totalPages);
                }
                
                return pageNumbers.map((pageNumber, index) => {
                  if (pageNumber === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2">
                        {pageNumber}
                      </span>
                    );
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-8 h-8 rounded-md text-sm ${
                        currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100'
                      }`}
                      aria-current={currentPage === pageNumber ? 'page' : undefined}
                    >
                      {pageNumber}
                    </button>
                  );
                });
              })()}
            </div>
            
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;