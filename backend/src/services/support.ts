import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export interface SupportTicketData {
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: 'general' | 'technical' | 'inventory' | 'account' | 'feature-request'
  userEmail: string
  userName: string
  userId: string
}

export interface User {
  id: string
  email: string
  name?: string
  isAdmin: boolean
}

export interface SupportTicketContext {
  user: {
    id: string
    email: string
    name?: string
    isAdmin: boolean
  }
  system: {
    timestamp: string
    userAgent?: string
    ipAddress?: string
    environment: string
  }
  inventoryContext?: {
    totalInventories: number
    recentActivity: string[]
  }
}

export class SupportService {
  private dropboxAccessToken: string
  private powerAutomateWebhookUrl: string

  constructor() {
    this.dropboxAccessToken = process.env.DROPBOX_ACCESS_TOKEN || ''
    this.powerAutomateWebhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL || ''
    
    if (!this.dropboxAccessToken) {
      console.warn('DROPBOX_ACCESS_TOKEN not configured - file upload will be disabled')
    }
    
    if (!this.powerAutomateWebhookUrl) {
      console.warn('POWER_AUTOMATE_WEBHOOK_URL not configured - Power Automate integration will be disabled')
    }
  }

  async createSupportTicket(ticketData: SupportTicketData, user: User): Promise<{ ticketId: string; uploadUrl?: string }> {
    const ticketId = uuidv4()
    const timestamp = new Date().toISOString()

    // Create comprehensive context for the support ticket
    const context: SupportTicketContext = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      },
      system: {
        timestamp,
        environment: process.env.NODE_ENV || 'development'
      }
    }

    // Try to get inventory context for the user
    try {
      context.inventoryContext = await this.getInventoryContext(user.id)
    } catch (error) {
      console.warn('Failed to get inventory context:', error)
    }

    // Create the support ticket JSON payload
    const supportTicketPayload = {
      ticketId,
      timestamp,
      ticket: {
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category,
        status: 'open'
      },
      context
    }

    console.log('Creating support ticket:', {
      ticketId,
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      userEmail: user.email
    })

    // Upload to Dropbox if configured
    let uploadUrl: string | undefined
    if (this.dropboxAccessToken) {
      try {
        uploadUrl = await this.uploadToDropbox(supportTicketPayload, ticketId)
        console.log('Support ticket uploaded to Dropbox:', uploadUrl)
      } catch (error) {
        console.error('Failed to upload to Dropbox:', error)
      }
    }

    // Trigger Power Automate flow if configured
    if (this.powerAutomateWebhookUrl) {
      try {
        await this.triggerPowerAutomate(supportTicketPayload)
        console.log('Power Automate flow triggered successfully')
      } catch (error) {
        console.error('Failed to trigger Power Automate:', error)
      }
    }

    // Store ticket in memory for now (in production, this would go to a database)
    this.storeTicketInMemory(supportTicketPayload)

    return { ticketId, uploadUrl }
  }

  private async uploadToDropbox(payload: any, ticketId: string): Promise<string> {
    const fileName = `support-ticket-${ticketId}-${Date.now()}.json`
    const filePath = `/support-tickets/${fileName}`

    try {
      const response = await axios.post('https://content.dropboxapi.com/2/files/upload', 
        JSON.stringify(payload, null, 2),
        {
          headers: {
            'Authorization': `Bearer ${this.dropboxAccessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
              path: filePath,
              mode: 'add',
              autorename: true
            }),
            'Content-Type': 'application/octet-stream'
          }
        }
      )

      // Get shareable link
      const linkResponse = await axios.post('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
        {
          path: filePath,
          settings: {
            requested_visibility: 'public'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.dropboxAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return linkResponse.data.url
    } catch (error) {
      console.error('Dropbox upload error:', error)
      throw new Error('Failed to upload support ticket to Dropbox')
    }
  }

  private async triggerPowerAutomate(payload: any): Promise<void> {
    try {
      await axios.post(this.powerAutomateWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      })
    } catch (error) {
      console.error('Power Automate trigger error:', error)
      throw new Error('Failed to trigger Power Automate flow')
    }
  }

  private async getInventoryContext(userId: string): Promise<any> {
    // This would typically query the database for user's inventory data
    // For now, return mock data
    return {
      totalInventories: 0,
      recentActivity: []
    }
  }

  private ticketStorage: Map<string, any> = new Map()

  private storeTicketInMemory(ticket: any): void {
    this.ticketStorage.set(ticket.ticketId, ticket)
  }

  async getUserSupportTickets(userId: string): Promise<any[]> {
    // Filter tickets by user ID
    const userTickets = Array.from(this.ticketStorage.values())
      .filter(ticket => ticket.context.user.id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return userTickets
  }

  async getAllSupportTickets(): Promise<any[]> {
    // Return all tickets for admin view
    const allTickets = Array.from(this.ticketStorage.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return allTickets
  }
}
