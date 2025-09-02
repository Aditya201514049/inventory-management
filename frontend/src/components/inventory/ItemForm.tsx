
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, updateItem, ItemInput } from '../../services/item';
import { generateCustomId, validateCustomId } from '../../services/customId';
import { Field } from '../../types/field';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ItemFormProps {
  inventoryId: string;
  fields: Field[];
  inventory?: any;
  initialData?: {
    id: string;
    customId: string;
    values: Record<string, any>;
    version: number;
  };
  onClose: () => void;
}

export default function ItemForm({ inventoryId, fields, inventory, initialData, onClose }: ItemFormProps) {
  const qc = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [customIdError, setCustomIdError] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      customId: initialData?.customId || '',
      values: initialData?.values || {}
    }
  });

  const customId = watch('customId');

  // Validate custom ID against format
  useEffect(() => {
    if (customId && inventory?.customIdParts?.length > 0) {
      const validateId = async () => {
        setIsValidating(true);
        setCustomIdError('');
        
        try {
          const response = await validateCustomId(inventoryId, customId);
          if (!response.valid) {
            setCustomIdError(response.message || 'Invalid custom ID format');
          }
        } catch (error) {
          setCustomIdError('Failed to validate custom ID');
        } finally {
          setIsValidating(false);
        }
      };

      const timeoutId = setTimeout(validateId, 500); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [customId, inventoryId, inventory?.customIdParts]);

  const generateCustomIdForForm = async () => {
    if (!inventory?.customIdParts?.length) {
      toast.error('No custom ID format defined for this inventory');
      return;
    }

    try {
      const response = await generateCustomId(inventoryId, inventory.customIdParts);
      setValue('customId', response.customId);
      setCustomIdError('');
      toast.success('Custom ID generated!');
    } catch (error) {
      toast.error('Failed to generate custom ID');
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: ItemInput) => createItem(inventoryId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', inventoryId] });
      toast.success('Item created successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: ItemInput) => updateItem(initialData!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', inventoryId] });
      toast.success('Item updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  });

  const onSubmit = (data: any) => {
    if (customIdError) {
      toast.error('Please fix the custom ID format error');
      return;
    }

    const itemData: ItemInput = {
      customId: data.customId,
      values: data.values,
      version: initialData?.version || 1
    };

    if (initialData) {
      updateMutation.mutate(itemData);
    } else {
      createMutation.mutate(itemData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Item' : 'Create Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Custom ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom ID *
            </label>
            <div className="flex gap-2">
              <input
                {...register('customId', { required: 'Custom ID is required' })}
                className={`flex-1 px-3 py-2 border rounded-md ${
                  errors.customId || customIdError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter custom ID"
              />
              {inventory?.customIdParts?.length > 0 && (
                <button
                  type="button"
                  onClick={generateCustomIdForForm}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Generate
                </button>
              )}
            </div>
            {errors.customId && (
              <p className="text-red-500 text-sm mt-1">{errors.customId.message}</p>
            )}
            {customIdError && (
              <p className="text-red-500 text-sm mt-1">{customIdError}</p>
            )}
            {isValidating && (
              <p className="text-blue-500 text-sm mt-1">Validating...</p>
            )}
          </div>

          {/* Dynamic Fields */}
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.title} {field.validation?.required && '*'}
              </label>
              
              {field.type === 'STRING' && (
                <input
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={field.description || `Enter ${field.title.toLowerCase()}`}
                />
              )}

              {field.type === 'NUMBER' && (
                <input
                  type="number"
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false,
                    valueAsNumber: true
                  })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={field.description || `Enter ${field.title.toLowerCase()}`}
                />
              )}

              {field.type === 'DATE' && (
                <input
                  type="date"
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {field.type === 'BOOLEAN' && (
                <input
                  type="checkbox"
                  {...register(`values.${field.name}`)}
                  className="mr-2"
                />
              )}

              {field.type === 'TEXT' && (
                <textarea
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={field.description || `Enter ${field.title.toLowerCase()}`}
                />
              )}

              {field.type === 'LINK' && (
                <input
                  type="url"
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={field.description || `Enter ${field.title.toLowerCase()}`}
                />
              )}

              {field.type === 'SELECT' && (
                <select
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {field.title.toLowerCase()}</option>
                  {field.validation?.options?.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {errors.values?.[field.name] && (
                <p className="text-red-500 text-sm mt-1">
                  {String(errors.values[field.name]?.message || 'Invalid value')}
                </p>
              )}
            </div>
          ))}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!customIdError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}