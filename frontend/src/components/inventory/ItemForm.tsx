
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, ItemInput } from '../../services/item';

type Field = {
  id: string;
  name: string;
  title: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT' | 'TEXT' | 'LINK';
  visible: boolean;
  description?: string; 
};

interface ItemFormProps {
  inventoryId: string;
  fields: Field[];
  initialData?: {
    id: string;
    customId: string;
    values: Record<string, any>;
    version: number;
  };
  onClose: () => void;
}

export default function ItemForm({ inventoryId, fields, initialData, onClose }: ItemFormProps) {
  const qc = useQueryClient();
  const isEditing = !!initialData;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      customId: initialData?.customId || '',
      values: initialData?.values || {},
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const itemData: ItemInput = {
        customId: data.customId,
        values: data.values,
        version: isEditing ? initialData!.version : 1
      };

      if (isEditing) {
        return updateItem(initialData!.id, itemData);
      } else {
        return createItem(inventoryId, itemData);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', inventoryId] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Item save error:', error);
      // Handle optimistic locking conflicts
      if (error.response?.status === 409) {
        alert('Item was modified by another user. Please refresh and try again.');
      }
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Custom ID</label>
            <input
              type="text"
              {...register('customId', { required: 'Custom ID is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
            {errors.customId && <p className="text-red-500 text-sm">{errors.customId.message}</p>}
          </div>

          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700">
                {field.title}
                {field.description && (
                  <span className="text-gray-500 text-xs ml-1">({field.description})</span>
                )}
              </label>
              
              {field.type === 'STRING' || field.type === 'LINK' ? (
                <input
                  type="text"
                  {...register(`values.${field.name}`)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : field.type === 'NUMBER' ? (
                <input
                  type="number"
                  {...register(`values.${field.name}`, { valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : field.type === 'DATE' ? (
                <input
                  type="date"
                  {...register(`values.${field.name}`)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : field.type === 'BOOLEAN' ? (
                <div className="mt-1">
                  <input
                    type="checkbox"
                    {...register(`values.${field.name}`)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </div>
              ) : field.type === 'TEXT' ? (
                <textarea
                  rows={3}
                  {...register(`values.${field.name}`)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              ) : field.type === 'SELECT' ? (
                <select
                  {...register(`values.${field.name}`)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select an option</option>
                  {/* TODO: Add select options from field validation */}
                </select>
              ) : null}
            </div>
          ))}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}