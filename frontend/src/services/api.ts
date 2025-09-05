import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
//const API_BASE_URL = 'http://localhost:4000/api'

// Helper for getting the correct auth URL (for login redirects, etc.)
export const getAuthUrl = (path: string) => {
  // Always use absolute /auth path for auth endpoints
  if (path.startsWith('/')) return `/auth${path.startsWith('/auth') ? path.slice(5) : path}`;
  return `/auth/${path}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for JWT authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove invalid token and redirect to login
      localStorage.removeItem('jwt_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api