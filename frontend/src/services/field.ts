
import api from './api';

export const getFields = async (inventoryId: string) => {
  const { data } = await api.get(`/fields/inventory/${inventoryId}`);
  return data;
};

export const createField = async (inventoryId: string, fieldData: any) => {
  const { data } = await api.post(`/fields/inventory/${inventoryId}`, fieldData);
  return data;
};

export const updateField = async (fieldId: string, fieldData: any) => {
  const { data } = await api.put(`/fields/${fieldId}`, fieldData);
  return data;
};

export const deleteField = async (fieldId: string) => {
  await api.delete(`/fields/${fieldId}`);
};

export const reorderFields = async (inventoryId: string, fieldIds: string[]) => {
  await api.put(`/fields/inventory/${inventoryId}/reorder`, { fieldIds });
};