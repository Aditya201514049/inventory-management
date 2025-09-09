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
  try {
    const { data } = await api.post(`/item/inventory/${inventoryId}`, body);
    return data;
  } catch (error: any) {
    console.error('Error creating item:', error);
    
    if (error.response?.status === 409) {
      const message = error.response?.data?.message || 'An item with this ID already exists in this inventory';
      throw new Error(message);
    } else if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to create items in this inventory';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Inventory not found');
    } else {
      throw new Error('Failed to create item. Please try again.');
    }
  }
};

export const updateItem = async (id: string, body: ItemInput) => {
  try {
    const { data } = await api.put(`/item/${id}`, body);
    return data;
  } catch (error: any) {
    console.error(`Error updating item ${id}:`, error);
    
    // Handle optimistic locking conflicts
    if (error.response?.status === 409) {
      const message = error.response?.data?.message || 'This item was modified by another user. Please refresh and try again.';
      throw new Error(message);
    } else if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to update this item';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Item not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while updating item');
    } else {
      throw new Error('Failed to update item. Please try again.');
    }
  }
};

export const deleteItem = async (id: string) => {
  try {
    await api.delete(`/item/${id}`);
  } catch (error: any) {
    console.error(`Error deleting item ${id}:`, error);
    
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to delete this item';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Item not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while deleting item');
    } else {
      throw new Error('Failed to delete item. Please try again.');
    }
  }
};