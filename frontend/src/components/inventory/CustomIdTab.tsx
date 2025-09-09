import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getInventory } from '../../services/inventory';
import { generateCustomId, saveCustomIdFormat } from '../../services/customId';
import { toast } from 'react-hot-toast';

interface CustomIdTabProps {
  inventoryId: string;
}

export default function CustomIdTab({ inventoryId }: CustomIdTabProps) {
  const qc = useQueryClient();
  const [customIdParts, setCustomIdParts] = useState<any[]>([]);
  const [generatedId, setGeneratedId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: () => getInventory(inventoryId)
  });

  useEffect(() => {
    if (inventory?.customIdParts) {
      setCustomIdParts(inventory.customIdParts.sort((a: any, b: any) => a.order - b.order));
    }
  }, [inventory]);

  const addPart = (type: string) => {
    const newPart = {
      type,
      format: type === 'FIXED' ? '' : null,
      order: customIdParts.length
    };
    setCustomIdParts([...customIdParts, newPart]);
  };

  const removePart = (index: number) => {
    const newParts = customIdParts.filter((_, i) => i !== index);
    // Reorder remaining parts
    const reorderedParts = newParts.map((part, i) => ({ ...part, order: i }));
    setCustomIdParts(reorderedParts);
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...customIdParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setCustomIdParts(newParts);
  };

  const movePart = (index: number, direction: 'up' | 'down') => {
    const newParts = [...customIdParts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newParts.length) {
      [newParts[index], newParts[targetIndex]] = [newParts[targetIndex], newParts[index]];
      // Update order
      newParts.forEach((part, i) => {
        part.order = i;
      });
      setCustomIdParts(newParts);
    }
  };

  const handleGenerate = async () => {
    if (customIdParts.length === 0) {
      toast.error('Please add at least one custom ID part');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await generateCustomId(inventoryId, customIdParts);
      setGeneratedId(response.customId);
      toast.success('Custom ID generated!');
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate custom ID');
    } finally {
      setIsGenerating(false);
    }
  };

  

const handleSave = async () => {
  if (!inventory) return;
  
  setIsSaving(true);
  try {
    await saveCustomIdFormat(inventoryId, customIdParts, inventory?.version || 1);
    qc.invalidateQueries({ queryKey: ['inventory', inventoryId] });
    toast.success('Custom ID format saved successfully!');
  } catch (error: any) {
    console.error('Error saving custom ID format:', error);
    
    // Show user-friendly error messages
    if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('Failed to save custom ID format. Please try again.');
    }
  } finally {
    setIsSaving(false);
  }
};



  const getPartPreview = (part: any) => {
    switch (part.type) {
      case 'FIXED':
        return part.format || 'TEXT';
      case 'RANDOM6':
        return 'ABC123';
      case 'RANDOM9':
        return 'ABC123DEF';
      case 'RANDOM20':
        return 'ABC123DEF456GHI789JKL';
      case 'RANDOM32':
        return 'ABC123DEF456GHI789JKL012MNO345PQR';
      case 'GUID':
        return '12345678-1234-1234-1234-123456789012';
      case 'DATE':
        return '2025-01-15';
      case 'SEQUENCE':
        return '001';
      default:
        return '???';
    }
  };

  const getFormatPreview = () => {
    return customIdParts.map(part => getPartPreview(part)).join('');
  };

  if (isLoading) return <div className="text-gray-600 dark:text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom ID Format</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Define how custom IDs should be generated for items in this inventory.
        </p>
      </div>

      {/* Format Preview */}
      {customIdParts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border dark:border-blue-800/30">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Format Preview:</h4>
          <div className="font-mono text-blue-800 dark:text-blue-200 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">
            {getFormatPreview()}
          </div>
        </div>
      )}

      {/* Add Parts */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add ID Parts:</h4>
        <div className="flex flex-wrap gap-2">
          {['FIXED', 'RANDOM6', 'RANDOM9', 'RANDOM20', 'RANDOM32', 'GUID', 'DATE', 'SEQUENCE'].map(type => (
            <button
              key={type}
              onClick={() => addPart(type)}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded text-sm transition-colors"
            >
              + {type}
            </button>
          ))}
        </div>
      </div>

      {/* Current Parts */}
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Format:</h4>
        {customIdParts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">No custom ID parts defined</p>
        ) : (
          <div className="space-y-2">
            {customIdParts.map((part, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{index + 1}.</span>
                
                <select
                  value={part.type}
                  onChange={(e) => updatePart(index, 'type', e.target.value)}
                  className="px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="FIXED">Fixed Text</option>
                  <option value="RANDOM6">Random 6 chars</option>
                  <option value="RANDOM9">Random 9 chars</option>
                  <option value="RANDOM20">Random 20 chars</option>
                  <option value="RANDOM32">Random 32 chars</option>
                  <option value="GUID">GUID</option>
                  <option value="DATE">Date</option>
                  <option value="SEQUENCE">Sequence</option>
                </select>

                {part.type === 'FIXED' && (
                  <input
                    type="text"
                    value={part.format || ''}
                    onChange={(e) => updatePart(index, 'format', e.target.value)}
                    placeholder="Enter fixed text"
                    className="px-2 py-1 border dark:border-gray-600 rounded text-sm flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}

                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {getPartPreview(part)}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() => movePart(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded disabled:opacity-50 transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => movePart(index, 'down')}
                    disabled={index === customIdParts.length - 1}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded disabled:opacity-50 transition-colors"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removePart(index)}
                    className="px-2 py-1 text-xs bg-red-200 dark:bg-red-900/30 hover:bg-red-300 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated ID */}
      {generatedId && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border dark:border-green-800/30">
          <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Generated ID:</h4>
          <div className="font-mono text-green-800 dark:text-green-200 bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">
            {generatedId}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={customIdParts.length === 0 || isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate ID'}
        </button>
        
        <button
          onClick={handleSave}
          disabled={customIdParts.length === 0 || isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Format'}
        </button>
      </div>
    </div>
  );
}