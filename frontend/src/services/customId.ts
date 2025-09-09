
import api from './api';

export interface CustomIdPart {
  type: 'FIXED' | 'RANDOM20' | 'RANDOM32' | 'RANDOM6' | 'RANDOM9' | 'GUID' | 'DATE' | 'SEQUENCE';
  format?: string | null;
  order: number;
}

export const generateCustomId = async (inventoryId: string, customIdParts: CustomIdPart[]) => {
  const { data } = await api.post(`/inventories/${inventoryId}/generate-id`, { customIdParts });
  return data;
};

export const validateCustomId = async (inventoryId: string, customId: string) => {
  const { data } = await api.post(`/inventories/${inventoryId}/validate-id`, { customId });
  return data;
};

// ... existing code ...

export const saveCustomIdFormat = async (inventoryId: string, customIdParts: CustomIdPart[], version: number) => {
  try {
    const { data } = await api.put(`/inventories/${inventoryId}`, {
      customIdParts,
      version
    });
    return data;
  } catch (error: any) {
    console.error(`Error saving custom ID format for inventory ${inventoryId}:`, error);
    
    // Handle optimistic locking conflicts
    if (error.response?.status === 409) {
      const message = error.response?.data?.message || 'This inventory was modified by another user. Please refresh and try again.';
      throw new Error(message);
    } else if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to modify this inventory';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Inventory not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while saving custom ID format');
    } else {
      throw new Error('Failed to save custom ID format. Please try again.');
    }
  }
};