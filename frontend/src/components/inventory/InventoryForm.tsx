import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Inventory, CreateInventoryInput, UpdateInventoryInput } from '../../types/inventory';
import { createInventory, updateInventory } from '../../services/inventory';

interface InventoryFormProps {
  initialData?: Inventory;
}

// Define the form data type
interface FormData {
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string; // This will be a string in the form
  customIdParts: any[];
}

const InventoryForm = ({ initialData }: InventoryFormProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditing = !!initialData;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description || '',
      isPublic: initialData.isPublic,
      tags: initialData.tags.join(', '), // Convert array to string for form
      customIdParts: initialData.customIdParts
    } : {
      title: '',
      description: '',
      isPublic: false,
      tags: '',
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
    }
  });

  const onSubmit = (formData: FormData) => {
    // Transform tags from string to array
    const transformedData: CreateInventoryInput | UpdateInventoryInput = {
      ...formData,
      tags: formData.tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
    };
    
    console.log('Form data:', formData); // Debug original form data
    console.log('Transformed data:', transformedData); // Debug transformed data
    mutation.mutate(transformedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          {...register('isPublic')}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
          Make this inventory public
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
        <input
          type="text"
          {...register('tags')}
          placeholder="tag1, tag2, tag3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'} Inventory
        </button>
      </div>
    </form>
  );
};

export default InventoryForm;