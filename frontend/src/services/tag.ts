import api from './api';

export const getTagAutocomplete = async (prefix: string): Promise<string[]> => {
  try {
    const response = await api.get('/inventories/tags/autocomplete', {
      params: { prefix }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tag autocomplete:', error);
    return [];
  }
};

export const getAllTags = async (): Promise<string[]> => {
  const { data } = await api.get('/tags');
  return data;
};

export const getTagStats = async (): Promise<Array<{ tag: string; count: number }>> => {
  const { data } = await api.get('/tags/stats');
  return data;
};