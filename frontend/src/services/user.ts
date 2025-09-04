import api from './api';

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

// Search users by name or email
export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  const response = await api.get(`/access/users/search?query=${encodeURIComponent(query)}`);
  return response.data;
};
