
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, ItemInput } from '../../services/item';
import { generateCustomId } from '../../services/customId';
import { Field } from '../../types/field';
import { useEffect } from 'react';

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

interface FormData {
  customId: string;
  values: Record<string, any>;
}

export default function ItemForm({ inventoryId, fields, initialData, onClose }: ItemFormProps) {
  const qc = useQueryClient();
  const isEditing = !!initialData;

  // Only show visible fields that are actually used
  const visibleFields = fields.filter(f => f.visible);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      customId: initialData?.customId || '',
      values: initialData?.values || {},
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
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
      if (error.response?.status === 409) {
        alert('Item was modified by another user. Please refresh and try again.');
      } else {
        alert('Failed to save item. Please try again.');
      }
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Add this function with proper typing
  const generateCustomIdForItem = async (): Promise<string> => {
    try {
      const response = await generateCustomId(inventoryId, []);
      return response.customId || '';
    } catch (error) {
      console.error('Failed to generate custom ID:', error);
      return '';
    }
  };

  // Update the form to auto-generate custom ID
  useEffect(() => {
    if (!isEditing) {
      generateCustomIdForItem().then((id: string) => {
        if (id) {
          setValue('customId', id);
        }
      });
    }
  }, [isEditing, setValue]);

  const renderField = (field: Field) => {
    const fieldName = `values.${field.name}` as const;
    const isRequired = field.validation?.required;

    switch (field.type) {
      case 'STRING':
      case 'LINK':
        return (
          <input
            type="text"
            {...register(fieldName, { 
              required: isRequired ? `${field.title} is required` : false 
            })}
            placeholder={`Enter ${field.title.toLowerCase()}`}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      case 'NUMBER':
        return (
          <input
            type="number"
            {...register(fieldName, { 
              required: isRequired ? `${field.title} is required` : false,
              valueAsNumber: true 
            })}
            placeholder={`Enter ${field.title.toLowerCase()}`}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      case 'DATE':
        return (
          <input
            type="date"
            {...register(fieldName, { 
              required: isRequired ? `${field.title} is required` : false 
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      case 'BOOLEAN':
        return (
          <div className="mt-1 flex items-center">
            <input
              type="checkbox"
              {...register(fieldName)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </div>
        );
      
      case 'TEXT':
        return (
          <textarea
            rows={3}
            {...register(fieldName, { 
              required: isRequired ? `${field.title} is required` : false 
            })}
            placeholder={`Enter ${field.title.toLowerCase()}`}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      
      case 'SELECT':
        const options = field.validation?.options || [];
        return (
          <select
            {...register(fieldName, { 
              required: isRequired ? `${field.title} is required` : false 
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select {field.title.toLowerCase()}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      default:
        return <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Custom ID Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Custom ID <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('customId', { required: 'Custom ID is required' })}
                  placeholder="Enter custom ID"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => generateCustomIdForItem().then((id: string) => setValue('customId', id))}
                    className="mt-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Generate
                  </button>
                )}
              </div>
              {errors.customId && <p className="text-red-500 text-sm mt-1">{errors.customId.message}</p>}
            </div>

            {/* Dynamic Fields */}
            {visibleFields.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                No fields defined for this inventory. Add fields in the Fields tab first.
              </div>
            ) : (
              visibleFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.title}
                    {field.validation?.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                  {renderField(field)}
                  {errors.values?.[field.name] && (
                    <p className="text-red-500 text-sm mt-1">
                      {String(errors.values[field.name]?.message || 'Invalid value')}
                    </p>
                  )}
                </div>
              ))
            )}

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
    </div>
  );
}