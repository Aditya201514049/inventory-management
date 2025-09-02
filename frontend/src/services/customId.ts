
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

export const updateCustomIdParts = async (inventoryId: string, customIdParts: CustomIdPart[]) => {
  const { data } = await api.put(`/inventories/${inventoryId}`, { customIdParts });
  return data;
};