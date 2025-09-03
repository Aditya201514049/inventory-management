import api from './api';

export interface UserStats {
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

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await api.get<UserStats>('/profile/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};
