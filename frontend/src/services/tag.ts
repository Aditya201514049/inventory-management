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