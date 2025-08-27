import { Router } from 'express';
import prisma from '../prisma';
import { ensureAuth } from '../middleware/ensureAuth';
import { z } from 'zod';

const router = Router();

// Middleware to ensure user is admin
function ensureAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// List all users with pagination and filtering
router.get('/users', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { page = '1', limit = '20', search = '', blocked = '' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (blocked !== '') {
      where.blocked = blocked === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          blocked: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              inventories: true,
              items: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get single user details
router.get('/users/:userId', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
        inventories: {
          select: {
            id: true,
            title: true,
            createdAt: true
          }
        },
        items: {
          select: {
            id: true,
            customId: true,
            createdAt: true
          }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Promote user to admin
router.post('/users/:userId/promote', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true
      }
    });
    
    res.json({ message: 'User promoted to admin successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to promote user' });
  }
});

// Demote admin to regular user
router.post('/users/:userId/demote', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    // Check if this is the last admin (prevent removing all admins)
    const adminCount = await prisma.user.count({
      where: { isAdmin: true }
    });

    if (adminCount <= 1) {
      return res.status(400).json({ 
        message: 'Cannot demote the last admin. At least one admin must remain.' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: false },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true
      }
    });
    
    res.json({ message: 'Admin demoted successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to demote admin' });
  }
});

// Block user
router.post('/users/:userId/block', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.blocked) {
      return res.status(400).json({ message: 'User is already blocked' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { blocked: true },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true
      }
    });
    
    res.json({ message: 'User blocked successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to block user' });
  }
});

// Unblock user
router.post('/users/:userId/unblock', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.blocked) {
      return res.status(400).json({ message: 'User is not blocked' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { blocked: false },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true
      }
    });
    
    res.json({ message: 'User unblocked successfully', user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to unblock user' });
  }
});

// Delete user (with cascade protection)
router.delete('/users/:userId', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      });

      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last admin. At least one admin must remain.' 
        });
      }
    }

    // Delete user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get admin dashboard statistics
router.get('/stats', ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalInventories,
      totalItems,
      blockedUsers,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.inventory.count(),
      prisma.item.count(),
      prisma.user.count({ where: { blocked: true } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalInventories,
      totalItems,
      blockedUsers,
      recentUsers
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

export default router;