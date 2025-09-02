import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory } from '../../services/inventory';
import { generateCustomId, updateCustomIdParts, CustomIdPart } from '../../services/customId';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-hot-toast';

interface CustomIdTabProps {
  inventoryId: string;
}

const ID_PART_TYPES = [
  { 
    type: 'FIXED', 
    label: 'Fixed Text', 
    description: 'Static text (e.g., "COMP", "LAPTOP")',
    example: 'COMP'
  },
  { 
    type: 'RANDOM20', 
    label: 'Random 20-bit', 
    description: 'Random 20-bit number',
    example: 'A1B2C'
  },
  { 
    type: 'RANDOM32', 
    label: 'Random 32-bit', 
    description: 'Random 32-bit number',
    example: 'E74FA329'
  },
  { 
    type: 'RANDOM6', 
    label: 'Random 6-digit', 
    description: 'Random 6-digit number',
    example: '123456'
  },
  { 
    type: 'RANDOM9', 
    label: 'Random 9-digit', 
    description: 'Random 9-digit number',
    example: '123456789'
  },
  { 
    type: 'GUID', 
    label: 'GUID', 
    description: 'Globally unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000'
  },
  { 
    type: 'DATE', 
    label: 'Date', 
    description: 'Current date',
    example: '2025-01-15'
  },
  { 
    type: 'SEQUENCE', 
    label: 'Sequence', 
    description: 'Auto-incrementing number',
    example: '001'
  },
];

export default function CustomIdTab({ inventoryId }: CustomIdTabProps) {
  const qc = useQueryClient();
  const [customIdParts, setCustomIdParts] = useState<CustomIdPart[]>([]);
  const [originalParts, setOriginalParts] = useState<CustomIdPart[]>([]);
  const [previewId, setPreviewId] = useState<string>('');
  const [showAddPart, setShowAddPart] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: () => getInventory(inventoryId),
  });

  const updateMutation = useMutation({
    mutationFn: (parts: CustomIdPart[]) => updateCustomIdParts(inventoryId, parts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', inventoryId] });
      setHasUnsavedChanges(false);
      toast.success('Custom ID format saved successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to save custom ID format');
      console.error('Save error:', error);
    },
  });

  const generatePreviewMutation = useMutation({
    mutationFn: (parts: CustomIdPart[]) => generateCustomId(inventoryId, parts),
    onSuccess: (data) => {
      setPreviewId(data.customId || '');
    },
  });

  useEffect(() => {
    if (inventory?.customIdParts) {
      setCustomIdParts(inventory.customIdParts);
      setOriginalParts(inventory.customIdParts);
    }
  }, [inventory]);

  useEffect(() => {
    if (customIdParts.length > 0) {
      generatePreviewMutation.mutate(customIdParts);
    }
  }, [customIdParts]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(customIdParts) !== JSON.stringify(originalParts);
    setHasUnsavedChanges(hasChanges);
  }, [customIdParts, originalParts]);

  const handleSave = () => {
    updateMutation.mutate(customIdParts);
  };

  const handleReset = () => {
    setCustomIdParts(originalParts);
    setHasUnsavedChanges(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(customIdParts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setCustomIdParts(updatedItems);
  };

  const addIdPart = (type: string) => {
    const newPart: CustomIdPart = {
      type: type as any,
      format: null,
      order: customIdParts.length
    };

    const updatedParts = [...customIdParts, newPart];
    setCustomIdParts(updatedParts);
    setShowAddPart(false);
  };

  const removeIdPart = (index: number) => {
    const updatedParts = customIdParts.filter((_, i) => i !== index);
    const reorderedParts = updatedParts.map((part, i) => ({
      ...part,
      order: i
    }));

    setCustomIdParts(reorderedParts);
  };

  const updatePartFormat = (index: number, format: string) => {
    const updatedParts = [...customIdParts];
    updatedParts[index] = { ...updatedParts[index], format };
    setCustomIdParts(updatedParts);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold mb-2">Custom ID Format</h3>
          <p className="text-gray-600 text-sm">
            Define how custom IDs are generated for items in this inventory.
          </p>
        </div>
        
        {/* Save/Reset Buttons */}
        {hasUnsavedChanges && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Format'}
            </button>
          </div>
        )}
      </div>

      {/* Current ID Parts */}
      <div>
        <h4 className="font-medium mb-3">ID Parts</h4>
        {customIdParts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No ID parts defined yet.</p>
            <p className="text-sm">Add parts to create a custom ID format.</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="id-parts">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {customIdParts.map((part, index) => {
                    const partType = ID_PART_TYPES.find(t => t.type === part.type);
                    return (
                      <Draggable key={`${part.type}-${index}`} draggableId={`${part.type}-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border rounded-lg bg-white ${
                              snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-move">
                                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-medium">{partType?.label}</div>
                                  <div className="text-sm text-gray-600">{partType?.description}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {part.type === 'FIXED' && (
                                  <input
                                    type="text"
                                    value={part.format || ''}
                                    onChange={(e) => updatePartFormat(index, e.target.value)}
                                    placeholder="Enter fixed text"
                                    className="px-2 py-1 border rounded text-sm"
                                  />
                                )}
                                <button
                                  onClick={() => removeIdPart(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Part Button */}
      <div>
        {!showAddPart ? (
          <button
            onClick={() => setShowAddPart(true)}
            className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            + Add ID Part
          </button>
        ) : (
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3">Choose ID Part Type</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ID_PART_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => addIdPart(type.type)}
                  className="text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                  <div className="text-xs text-gray-500 mt-1">Example: {type.example}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddPart(false)}
              className="mt-3 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      {customIdParts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
          <div className="text-lg font-mono text-blue-800">
            {generatePreviewMutation.isPending ? 'Generating...' : previewId || 'No preview available'}
          </div>
          <p className="text-sm text-blue-700 mt-1">
            This is how new item IDs will be generated
          </p>
        </div>
      )}

      {/* Saved Format Display */}
      {!hasUnsavedChanges && customIdParts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h4 className="font-medium text-green-900">Format Saved</h4>
          </div>
          <p className="text-sm text-green-700">
            This custom ID format is now active and will be used for all new items.
          </p>
        </div>
      )}

      {/* Help */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-medium mb-2">How it works</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Drag and drop parts to reorder them</li>
          <li>• Fixed text parts require you to enter the text</li>
          <li>• Random parts generate different values each time</li>
          <li>• Sequence parts auto-increment (001, 002, 003...)</li>
          <li>• Date parts use the current date when creating items</li>
          <li>• <strong>Click "Save Format" to apply changes</strong></li>
        </ul>
      </div>
    </div>
  );
}