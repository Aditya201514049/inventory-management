
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFields, createField, updateField, deleteField } from '../../services/field';
import { Field } from '../../types/field';
import FieldForm from './FieldForm'; // Add this import

interface FieldsTabProps {
  inventoryId: string;
}

export default function FieldsTab({ inventoryId }: FieldsTabProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['fields', inventoryId],
    queryFn: () => getFields(inventoryId),
  });

  const fields = data?.fields || [];

  const createMutation = useMutation({
    mutationFn: (fieldData: any) => createField(inventoryId, fieldData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', inventoryId] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ fieldId, fieldData }: { fieldId: string; fieldData: any }) => 
      updateField(fieldId, fieldData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', inventoryId] });
      setShowForm(false);
      setEditingField(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => deleteField(fieldId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fields', inventoryId] });
    },
  });

  const handleAdd = () => {
    setEditingField(null);
    setShowForm(true);
  };

  const handleEdit = (field: Field) => {
    setEditingField(field);
    setShowForm(true);
  };

  const handleDelete = (fieldId: string) => {
    if (window.confirm('Delete this field? This action cannot be undone.')) {
      deleteMutation.mutate(fieldId);
    }
  };

  const getFieldTypeCount = (type: string) => {
    return fields.filter((f: Field) => f.type === type).length;
  };

  const canAddFieldType = (type: string) => {
    return getFieldTypeCount(type) < 3;
  };

  if (isLoading) return <div>Loading fields...</div>;
  if (error) return <div className="text-red-600">Failed to load fields</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fields</h3>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No fields defined yet.</p>
          <p className="text-sm">Add fields to define what data your items will store.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field: Field) => (
            <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.title}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {field.type}
                  </span>
                  {!field.visible && (
                    <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                {field.description && (
                  <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Field name: {field.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(field)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(field.id)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50 text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Field Form Modal */}
      {showForm && (
        <FieldForm
          inventoryId={inventoryId}
          field={editingField}
          onClose={() => {
            setShowForm(false);
            setEditingField(null);
          }}
          onSave={(fieldData: any) => {
            if (editingField) {
              updateMutation.mutate({ fieldId: editingField.id, fieldData });
            } else {
              createMutation.mutate(fieldData);
            }
          }}
          canAddFieldType={canAddFieldType}
        />
      )}
    </div>
  );
}