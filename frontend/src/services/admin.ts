import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    inventories: number;
    items: number;
    comments: number;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalInventories: number;
  totalItems: number;
  blockedUsers: number;
  recentUsers: AdminUser[];
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get admin dashboard statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Get all users with pagination and filtering
export const getUsers = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  blocked?: boolean;
}): Promise<UsersResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.blocked !== undefined) searchParams.set('blocked', params.blocked.toString());

  const response = await api.get(`/admin/users?${searchParams}`);
  return response.data;
};

// Get single user details
export const getUser = async (userId: string): Promise<AdminUser> => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

// Promote user to admin
export const promoteUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/promote`);
};

// Demote admin to regular user
export const demoteUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/demote`);
};

// Block user
export const blockUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/block`);
};

// Unblock user
export const unblockUser = async (userId: string): Promise<void> => {
  await api.post(`/admin/users/${userId}/unblock`);
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/admin/users/${userId}`);
};
