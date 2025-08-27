import { Router } from 'express';
import prisma from '../prisma';
import { ensureAuth } from '../middleware/ensureAuth';
import { z } from 'zod';

const router = Router();

// Get access list for an inventory
router.get('/inventory/:inventoryId', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { inventoryId } = req.params;

    // Check if user has access to view this inventory
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { ownerId: true, isPublic: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.ownerId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const accessList = await prisma.access.findMany({
      where: { inventoryId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(accessList);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch access list' });
  }
});

// Grant access to a user
router.post('/inventory/:inventoryId', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { inventoryId } = req.params;
    const { userId, canWrite = false } = req.body;

    // Check if user has permission to manage access
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { ownerId: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.ownerId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if access already exists
    const existingAccess = await prisma.access.findUnique({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId
        }
      }
    });

    if (existingAccess) {
      return res.status(400).json({ message: 'Access already granted' });
    }

    const access = await prisma.access.create({
      data: {
        inventoryId,
        userId,
        canWrite
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json(access);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to grant access' });
  }
});

// Update access permissions
router.put('/inventory/:inventoryId/user/:userId', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { inventoryId, userId } = req.params;
    const { canWrite } = req.body;

    // Check if user has permission to manage access
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { ownerId: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.ownerId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const access = await prisma.access.update({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId
        }
      },
      data: { canWrite },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    res.json(access);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update access' });
  }
});

// Revoke access
router.delete('/inventory/:inventoryId/user/:userId', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { inventoryId, userId } = req.params;

    // Check if user has permission to manage access
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { ownerId: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.ownerId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.access.delete({
      where: {
        inventoryId_userId: {
          inventoryId,
          userId
        }
      }
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to revoke access' });
  }
});

// Search users for autocomplete (by name or email)
router.get('/users/search', ensureAuth, async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    if (!query || (query as string).length < 2) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query as string, mode: 'insensitive' } },
          { email: { contains: query as string, mode: 'insensitive' } }
        ],
        blocked: false
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to search users' });
  }
});

export default router;