import api from './api';

export interface AccessUser {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  canWrite: boolean;
}

export interface UpdateInventoryAccessData {
  isPublic?: boolean;
}

// Get inventory access list
export const getInventoryAccess = async (inventoryId: string): Promise<AccessUser[]> => {
  const response = await api.get(`/access/inventory/${inventoryId}`);
  return response.data;
};

// Add user access to inventory
export const addUserAccess = async (inventoryId: string, userId: string): Promise<void> => {
  await api.post(`/access/inventory/${inventoryId}`, {
    userId,
    canWrite: true
  });
};

// Remove user access from inventory
export const removeUserAccess = async (inventoryId: string, userId: string): Promise<void> => {
  await api.delete(`/access/inventory/${inventoryId}/user/${userId}`);
};

// Update inventory access settings (public/private)
export const updateInventoryAccess = async (
  inventoryId: string, 
  data: UpdateInventoryAccessData
): Promise<void> => {
  await api.patch(`/api/inventories/${inventoryId}`, data);
};
