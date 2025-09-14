import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface SalesforceUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface SalesforceResponse {
  success: boolean;
  message: string;
  accountId?: string;
  contactId?: string;
  salesforceUrl?: string;
  error?: string;
}

export const testSalesforceConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/salesforce/test`, {
    method: 'GET',
    headers: authService.getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const checkSalesforceAuthStatus = async (): Promise<{ authenticated: boolean; userId?: string }> => {
  const response = await fetch(`${API_BASE_URL}/salesforce/auth-status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const createSalesforceAccountContact = async (userData: SalesforceUserData): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/salesforce/create-account-contact`, {
    method: 'POST',
    headers: {
      ...authService.getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  return data;
};
