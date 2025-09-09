import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Inventory, CreateInventoryInput, UpdateInventoryInput } from '../../types/inventory';
import { createInventory, updateInventory } from '../../services/inventory';
import { useAuth } from '../../contexts/AuthContext';
import { Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EnhancedTagInput from './EnhancedTagInput';

interface InventoryFormProps {
  initialData?: Inventory;
}

// Define the form data type
interface FormData {
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[]; // Real array
  customIdParts: any[];
}

const InventoryForm = ({ initialData }: InventoryFormProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditing = !!initialData;
  const { user } = useAuth();

  // Check if current user is the owner of this specific inventory or is an admin
  const isOwner = !initialData || (user && (initialData.ownerId === user.id || user.isAdmin));

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      isPublic: initialData.isPublic,
      tags: initialData.tags, // Use array directly
      customIdParts: initialData.customIdParts
    } : {
      title: '',
      description: '',
      isPublic: false,
      tags: [], // Start empty
      customIdParts: []
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateInventoryInput | UpdateInventoryInput) => {
      if (isEditing && initialData) {
        return await updateInventory(initialData.id, {
          ...data,
          version: initialData.version
        } as UpdateInventoryInput);
      }
      return await createInventory(data as CreateInventoryInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
      navigate('/inventories');
    },
    onError: (error: any) => {
      console.error('Inventory mutation error:', error);
      
      // Show user-friendly error messages
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  });

  const onSubmit = (formData: FormData) => {
    mutation.mutate(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="Describe your inventory..."
          />
        </div>

        <div className="flex items-center">
          {isOwner ? (
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
          ) : (
            <input
              type="checkbox"
              id="isPublic"
              {...register('isPublic')}
              disabled
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
            />
          )}
          <label htmlFor="isPublic" className="ml-3 block text-sm text-gray-700 dark:text-gray-300">
            Make this inventory public
          </label>
          {!isOwner && (
            <Info className="ml-2 w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
          <EnhancedTagInput
            value={watch('tags') || []}
            onChange={(tags) => setValue('tags', tags)}
            placeholder="Type to add tags..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Press Enter or comma to add tags. Start typing to see suggestions.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'} Inventory
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;