// frontend/src/components/inventory/FieldForm.tsx
import { useForm } from 'react-hook-form';
import { Field } from '../../types/field';

interface FieldFormProps {
  inventoryId: string;
  field?: Field | null;
  onClose: () => void;
  onSave: (data: any) => void;
  canAddFieldType: (type: string) => boolean;
}

const FIELD_TYPES = [
  { value: 'STRING', label: 'Text (Single Line)', description: 'Short text input' },
  { value: 'TEXT', label: 'Text (Multi Line)', description: 'Long text input' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric input' },
  { value: 'DATE', label: 'Date', description: 'Date picker' },
  { value: 'BOOLEAN', label: 'Yes/No', description: 'Checkbox' },
  { value: 'SELECT', label: 'Dropdown', description: 'Select from options' },
  { value: 'LINK', label: 'Link', description: 'URL or file link' },
];

export default function FieldForm({ field, onClose, onSave, canAddFieldType }: FieldFormProps) {
  const isEditing = !!field;

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: field ? {
      name: field.name,
      type: field.type,
      title: field.title,
      description: field.description || '',
      visible: field.visible,
      required: field.validation?.required || false,
    } : {
      name: '',
      type: 'STRING',
      title: '',
      description: '',
      visible: true,
      required: false,
    }
  });

  const selectedType = watch('type');

  const onSubmit = (data: any) => {
    const fieldData = {
      name: data.name,
      type: data.type,
      title: data.title,
      description: data.description,
      visible: data.visible,
      validation: {
        required: data.required,
      },
      order: 0, // Will be set by backend
    };

    onSave(fieldData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {isEditing ? 'Edit Field' : 'Add New Field'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Field name is required',
                  pattern: {
                    value: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                    message: 'Field name must start with a letter and contain only letters, numbers, and underscores'
                  }
                })}
                placeholder="e.g., model, price, purchase_date"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Field Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type', { required: 'Field type is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value} disabled={!canAddFieldType(type.value)}>
                    {type.label} {!canAddFieldType(type.value) && '(Max 3 reached)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {FIELD_TYPES.find(t => t.value === selectedType)?.description}
              </p>
            </div>

            {/* Field Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title', { required: 'Display title is required' })}
                placeholder="e.g., Model, Price, Purchase Date"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="Optional description for this field"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('visible')}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show in item list</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('required')}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Required field</span>
              </label>
            </div>

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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}