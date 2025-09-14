import { Router } from 'express'
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth'
import { SupportService } from '../services/support'

const router = Router()
const supportService = new SupportService()

// Create a new support ticket
router.post('/ticket', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, description, priority, category } = req.body
    const user = req.user

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to create support tickets'
      })
    }

    if (!subject || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Subject and description are required'
      })
    }

    // Validate priority and category
    const validPriorities = ['low', 'medium', 'high']
    const validCategories = ['general', 'technical', 'inventory', 'account', 'feature-request']
    
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority',
        message: 'Priority must be one of: low, medium, high'
      })
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category must be one of: general, technical, inventory, account, feature-request'
      })
    }

    const ticketData = {
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      userEmail: user.email,
      userName: user.name || user.email,
      userId: user.id
    }

    console.log('Creating support ticket for user:', user.email)
    
    const result = await supportService.createSupportTicket(ticketData, user)
    
    res.json({
      success: true,
      ticketId: result.ticketId,
      uploadUrl: result.uploadUrl,
      message: 'Support ticket created successfully. You will receive email updates on the ticket status.'
    })

  } catch (error) {
    console.error('Error creating support ticket:', error)
    res.status(500).json({
      error: 'Failed to create support ticket',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Get user's support tickets
router.get('/tickets', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to view support tickets'
      })
    }
    
    console.log('Fetching support tickets for user:', user.email)
    
    const tickets = await supportService.getUserSupportTickets(user.id)
    
    res.json({
      success: true,
      tickets
    })

  } catch (error) {
    console.error('Error fetching support tickets:', error)
    res.status(500).json({
      error: 'Failed to fetch support tickets',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

// Admin route to get all support tickets
router.get('/admin/tickets', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      })
    }
    
    if (!user.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      })
    }
    
    console.log('Admin fetching all support tickets')
    
    const tickets = await supportService.getAllSupportTickets()
    
    res.json({
      success: true,
      tickets
    })

  } catch (error) {
    console.error('Error fetching admin support tickets:', error)
    res.status(500).json({
      error: 'Failed to fetch support tickets',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

export default router
