import { authService } from './auth'

export interface SupportTicketData {
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: 'general' | 'technical' | 'inventory' | 'account' | 'feature-request'
  userEmail: string
  userName: string
  userId: string
}

export interface SupportTicketResponse {
  success: boolean
  ticketId: string
  uploadUrl?: string
  message: string
}

class SupportService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  async createSupportTicket(ticketData: SupportTicketData): Promise<SupportTicketResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/support/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders()
        },
        body: JSON.stringify(ticketData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to create support ticket`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Support service error:', error)
      throw error instanceof Error ? error : new Error('Failed to create support ticket')
    }
  }

  async getSupportTickets(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/support/tickets`, {
        method: 'GET',
        headers: {
          ...authService.getAuthHeaders()
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch support tickets`)
      }

      const result = await response.json()
      return result.tickets || []
    } catch (error) {
      console.error('Support service error:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch support tickets')
    }
  }
}

export const supportService = new SupportService()
