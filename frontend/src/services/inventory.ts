import api from './api';
import { Inventory, CreateInventoryInput, UpdateInventoryInput, PaginatedResponse } from '../types/inventory';

interface GetInventoriesParams {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}


export const getInventories = async (params?: GetInventoriesParams): Promise<PaginatedResponse<Inventory>> => {
  try {
    const queryParams = {
      page: 1,
      limit: 10,
      ...params
    };
    const response = await api.get('/inventories', { params: queryParams });
    // Map backend response to frontend expected shape
    return {
      data: response.data.inventories || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10,
      totalPages: response.data.pagination?.pages || 1
    };
  } catch (error) {
    console.error('Error fetching inventories:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    };
  }
};

export const getInventory = async (id: string): Promise<Inventory> => {
  try {
    const response = await api.get<{ data: Inventory }>(`/inventories/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching inventory ${id}:`, error);
    throw error;
  }
};




export const createInventory = async (data: CreateInventoryInput): Promise<Inventory> => {
  try {
    const response = await api.post<{ data: Inventory }>('/inventories', data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating inventory:', error);
    throw error;
  }
};

export const updateInventory = async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
  try {
    const response = await api.put<{ data: Inventory }>(`/inventories/${id}`, data);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating inventory ${id}:`, error);
    throw error;
  }
};

export const deleteInventory = async (id: string): Promise<void> => {
  try {
    await api.delete(`/inventories/${id}`);
  } catch (error) {
    console.error(`Error deleting inventory ${id}:`, error);
    throw error;
  }
};