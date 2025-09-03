import { Router } from 'express';
import prisma from '../prisma';
import { ensureAuth } from '../middleware/ensureAuth';

const router = Router();

// Search users by name or email (for autocomplete)
router.get('/search', ensureAuth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }
    
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { blocked: false }, // Don't include blocked users
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 10, // Limit results for performance
      orderBy: [
        { name: 'asc' },
        { email: 'asc' }
      ]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get current user's profile
router.get('/profile', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
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
            comments: true,
            likes: true
          }
        }
      }
    });

    res.json(userProfile);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update current user's profile
router.put('/profile', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        blocked: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get current user's owned inventories
router.get('/profile/inventories', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = '1', limit = '20', search = '' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = { ownerId: user.id };
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } }
      ];
    }

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: { items: true, comments: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.inventory.count({ where })
    ]);

    res.json({
      inventories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch inventories' });
  }
});

// Get current user's write access inventories
router.get('/profile/access', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [accessList, total] = await Promise.all([
      prisma.access.findMany({
        where: { 
          userId: user.id,
          canWrite: true
        },
        include: {
          inventory: {
            include: {
              owner: { select: { id: true, name: true, email: true } },
              category: true,
              _count: {
                select: { items: true, comments: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.access.count({ 
        where: { 
          userId: user.id,
          canWrite: true
        }
      })
    ]);

    res.json({
      accessList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch access list' });
  }
});

// Get public user profile (by ID)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            inventories: true,
            items: true,
            comments: true
          }
        }
      }
    });

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userProfile);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Get user's public inventories
router.get('/:userId/inventories', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where: { 
          ownerId: userId,
          isPublic: true // Only public inventories
        },
        include: {
          category: true,
          _count: {
            select: { items: true, comments: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.inventory.count({ 
        where: { 
          ownerId: userId,
          isPublic: true
        }
      })
    ]);

    res.json({
      inventories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch user inventories' });
  }
});

// Get user's activity (recent items, comments, likes)
router.get('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [recentItems, recentComments, recentLikes] = await Promise.all([
      prisma.item.findMany({
        where: { userId },
        include: {
          inventory: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
      }),
      prisma.comment.findMany({
        where: { userId },
        include: {
          item: { 
            select: { 
              customId: true,
              inventory: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
      }),
      prisma.like.findMany({
        where: { userId },
        include: {
          item: { 
            select: { 
              customId: true,
              inventory: { select: { title: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
      })
    ]);

    res.json({
      recentItems,
      recentComments,
      recentLikes
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch user activity' });
  }
});

export default router;