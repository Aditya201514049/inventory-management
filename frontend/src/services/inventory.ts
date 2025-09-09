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

export const getAdminInventories = async (params?: GetInventoriesParams): Promise<PaginatedResponse<Inventory>> => {
  try {
    const queryParams = {
      page: 1,
      limit: 10,
      ...params
    };
    const response = await api.get('/inventories/admin/all', { params: queryParams });
    // Map backend response to frontend expected shape
    return {
      data: response.data.inventories || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10,
      totalPages: response.data.pagination?.pages || 1
    };
  } catch (error) {
    console.error('Error fetching admin inventories:', error);
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
    const response = await api.get<Inventory>(`/inventories/${id}`);
    return response.data; // Remove .data since backend returns inventory directly
  } catch (error) {
    console.error(`Error fetching inventory ${id}:`, error);
    throw error;
  }
};

export const createInventory = async (data: CreateInventoryInput): Promise<Inventory> => {
  try {
    console.log('Sending to backend:', JSON.stringify(data, null, 2)); // Debug what we're sending
    const response = await api.post<Inventory>('/inventories', data);
    return response.data; // Remove .data since backend returns inventory directly
  } catch (error: any) {
    console.error('Error creating inventory:', error);
    console.error('Error response data:', error.response?.data); // Show the actual error message
    console.error('Error status:', error.response?.status);
    console.error('Full error:', error.response);
    throw error;
  }
};
/*
export const updateInventory = async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
  try {
    const response = await api.put<Inventory>(`/inventories/${id}`, data);
    return response.data; // Remove .data since backend returns inventory directly
  } catch (error) {
    console.error(`Error updating inventory ${id}:`, error);
    throw error;
  }
};
*/


export const updateInventory = async (id: string, data: UpdateInventoryInput): Promise<Inventory> => {
  try {
    const response = await api.put<Inventory>(`/inventories/${id}`, data);
    return response.data; // Remove .data since backend returns inventory directly
  } catch (error: any) {
    console.error(`Error updating inventory ${id}:`, error);
    
    // Handle optimistic locking conflicts
    if (error.response?.status === 409) {
      const message = error.response?.data?.message || 'This inventory was modified by another user. Please refresh and try again.';
      throw new Error(message);
    } else if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to update this inventory';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Inventory not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while updating inventory');
    } else {
      throw new Error('Failed to update inventory. Please try again.');
    }
  }
};



export const deleteInventory = async (id: string): Promise<void> => {
  try {
    await api.delete(`/inventories/${id}`);
  } catch (error: any) {
    console.error(`Error deleting inventory ${id}:`, error);
    
    // Enhanced error handling with user-friendly messages
    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to delete this inventory';
      throw new Error(message);
    } else if (error.response?.status === 404) {
      throw new Error('Inventory not found');
    } else if (error.response?.status === 500) {
      throw new Error('Server error occurred while deleting inventory');
    } else {
      throw new Error('Failed to delete inventory. Please try again.');
    }
  }
};

export const getUserInventories = async (userId?: string): Promise<PaginatedResponse<Inventory>> => {
  try {
    const params = userId ? { owner: userId } : {};
    const response = await api.get('/inventories/my', { params });
    console.log('getUserInventories raw response:', response.data);
    
    // Backend returns { data: [], page, limit, total, totalPages }
    return {
      data: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
      totalPages: response.data.totalPages || 1
    };
  } catch (error) {
    console.error('Error fetching user inventories:', error);
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1
    };
  }
};