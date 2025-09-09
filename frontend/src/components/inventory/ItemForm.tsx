
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
  const [isCustomIdValid, setIsCustomIdValid] = useState<boolean>(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      customId: initialData?.customId || '',
      values: initialData?.values || {}
    }
  });

  const customId = watch('customId');

  // Validate custom ID against format
  useEffect(() => {
    // If there's a custom ID format defined, validate the custom ID
    if (inventory?.customIdParts?.length > 0) {
      if (!customId || customId.trim() === '') {
        setCustomIdError('Custom ID is required');
        setIsCustomIdValid(false);
        return;
      }

      const validateId = async () => {
        setIsValidating(true);
        setCustomIdError('');
        
        try {
          const response = await validateCustomId(inventoryId, customId);
          if (!response.valid) {
            setCustomIdError(response.message || 'Invalid custom ID format');
            setIsCustomIdValid(false);
          } else {
            setCustomIdError('');
            setIsCustomIdValid(true);
          }
        } catch (error) {
          setCustomIdError('Failed to validate custom ID');
          setIsCustomIdValid(false);
        } finally {
          setIsValidating(false);
        }
      };

      const timeoutId = setTimeout(validateId, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      // No format defined, so any custom ID is valid
      setCustomIdError('');
      setIsCustomIdValid(true);
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
      setIsCustomIdValid(true);
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
      console.error('Item creation error:', error);
      
      // Show user-friendly error messages
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
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
      console.error('Item update error:', error);
      
      // Show user-friendly error messages
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  });

  const onSubmit = (data: any) => {
    // Check if custom ID format is enforced and validation failed
    if (inventory?.customIdParts?.length > 0 && !isCustomIdValid) {
      toast.error('Please fix the custom ID format error before saving');
      return;
    }

    // Check if custom ID is required but empty
    if (inventory?.customIdParts?.length > 0 && (!data.customId || data.customId.trim() === '')) {
      toast.error('Custom ID is required');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Item' : 'Create Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Custom ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom ID *
              {inventory?.customIdParts?.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Format enforced)
                </span>
              )}
            </label>
            
            {/* Show format preview if available */}
            {inventory?.customIdParts?.length > 0 && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border dark:border-blue-800/30">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Required Format:</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                  {inventory.customIdParts
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((part: any) => {
                      switch (part.type) {
                        case 'FIXED': return part.format || 'TEXT';
                        case 'RANDOM6': return 'ABC123';
                        case 'RANDOM9': return 'ABC123DEF';
                        case 'RANDOM20': return 'ABC123DEF456GHI789JKL';
                        case 'RANDOM32': return 'ABC123DEF456GHI789JKL012MNO345PQR';
                        case 'GUID': return '12345678-1234-1234-1234-123456789012';
                        case 'DATE': return '2025-01-15';
                        case 'SEQUENCE': return '001';
                        default: return '???';
                      }
                    })
                    .join('')}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                {...register('customId', { required: 'Custom ID is required' })}
                className={`flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.customId || customIdError ? 'border-red-500' : 
                  isCustomIdValid && customId ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={inventory?.customIdParts?.length > 0 ? 
                  "Enter custom ID matching the format above" : 
                  "Enter custom ID"
                }
              />
              {inventory?.customIdParts?.length > 0 && (
                <button
                  type="button"
                  onClick={generateCustomIdForForm}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Generate
                </button>
              )}
            </div>
            
            {/* Status indicators */}
            {isValidating && (
              <p className="text-blue-500 dark:text-blue-400 text-sm mt-1">Validating format...</p>
            )}
            {!isValidating && isCustomIdValid && customId && (
              <p className="text-green-500 dark:text-green-400 text-sm mt-1">✓ Format is valid</p>
            )}
            {errors.customId && (
              <p className="text-red-500 text-sm mt-1">{errors.customId.message}</p>
            )}
            {customIdError && (
              <p className="text-red-500 text-sm mt-1">{customIdError}</p>
            )}
          </div>

          {/* Dynamic Fields */}
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.title} {field.validation?.required && '*'}
              </label>
              
              {field.type === 'STRING' && (
                <input
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              )}

              {field.type === 'BOOLEAN' && (
                <input
                  type="checkbox"
                  {...register(`values.${field.name}`)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700"
                />
              )}

              {field.type === 'TEXT' && (
                <textarea
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={field.description || `Enter ${field.title.toLowerCase()}`}
                />
              )}

              {field.type === 'SELECT' && (
                <select
                  {...register(`values.${field.name}`, {
                    required: field.validation?.required ? `${field.title} is required` : false
                  })}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.values?.[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isCustomIdValid || isValidating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}