import express from 'express';
import { Request, Response } from 'express';
import { ensureAuth } from '../middleware/ensureAuth';
import prisma from '../prisma';

const router = express.Router();

// Get current user's profile
router.get('/profile', ensureAuth, (req: Request, res: Response) => {
  console.log('=== PROFILE REQUEST ===');
  console.log('Session ID:', (req as any).sessionID);
  console.log('Is Authenticated:', (req as any).isAuthenticated());
  console.log('User:', (req as any).user);
  res.json({ user: req.user });
});

// Get current user's stats (inventories, items, comments count)
router.get('/stats', ensureAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    console.log('DEBUG: Profile stats requested for user ID:', userId);
    console.log('DEBUG: User object:', (req as any).user);
    
    const userWithStats = await prisma.user.findUnique({
      where: { id: userId },
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
      }
    });

    console.log('DEBUG: User stats found:', userWithStats);

    if (!userWithStats) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userWithStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

export default router;
