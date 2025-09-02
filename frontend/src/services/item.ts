import api from './api';

export interface ItemInput {
  customId: string;
  values: Record<string, any>;
  version?: number;
}

export const listItems = async (inventoryId: string, params?: { page?: number; limit?: number; search?: string }) => {
  const { data } = await api.get(`/item/inventory/${inventoryId}`, { params });
  return data; // { items, inventory: { id, title, fields }, pagination }
};

export const getItem = async (id: string) => {
  const { data } = await api.get(`/item/${id}`);
  return data;
};

export const createItem = async (inventoryId: string, body: ItemInput) => {
  const { data } = await api.post(`/item/inventory/${inventoryId}`, body);
  return data;
};

export const updateItem = async (id: string, body: ItemInput) => {
  const { data } = await api.put(`/item/${id}`, body);
  return data;
};

export const deleteItem = async (id: string) => {
  await api.delete(`/item/${id}`);
};