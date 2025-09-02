import { Router } from 'express';
import prisma from '../prisma';
import { ensureAuth } from '../middleware/ensureAuth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createItemSchema = z.object({
  customId: z.string().min(1),
  values: z.record(z.any(), z.any()), // JSON object for field values
  version: z.number().int().positive().optional().default(1)
});

const updateItemSchema = z.object({
  customId: z.string().min(1).optional(),
  values: z.record(z.any(), z.any()).optional(),
  version: z.number().int().positive() // Required for optimistic locking
});

// Helper function to check if user can write to inventory
async function canWriteToInventory(inventoryId: string, userId: string): Promise<boolean> {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    select: { ownerId: true, isPublic: true }
  });

  if (!inventory) return false;
  
  // Owner can always write
  if (inventory.ownerId === userId) return true;
  
  // Public inventory - any authenticated user can write
  if (inventory.isPublic) return true;
  
  // Check explicit access
  const access = await prisma.access.findUnique({
    where: {
      inventoryId_userId: { inventoryId, userId }
    }
  });
  
  return access?.canWrite || false;
}

// List items in an inventory
router.get('/inventory/:inventoryId', async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { page = '1', limit = '20', search = '' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { fields: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Build search query for item values
    const where: any = { inventoryId };
    if (search) {
      // Search in customId and field values
      where.OR = [
        { customId: { contains: search as string, mode: 'insensitive' } },
        { values: { path: ['$'], string_contains: search as string } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.item.count({ where })
    ]);

    res.json({
      items,
      inventory: {
        id: inventory.id,
        title: inventory.title,
        fields: inventory.fields
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        inventory: {
          include: { fields: true }
        },
        user: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        likes: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/inventory/:inventoryId', ensureAuth, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const user = (req as any).user;
    const parsed = createItemSchema.parse(req.body);

    // Check if user can write to this inventory
    const canWrite = await canWriteToInventory(inventoryId, user.id);
    if (!canWrite) {
      return res.status(403).json({ message: 'No write access to this inventory' });
    }

    // Get inventory with custom ID parts for validation
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { customIdParts: { orderBy: { order: 'asc' } } }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Validate custom ID format if format is defined
    if (inventory.customIdParts && inventory.customIdParts.length > 0) {
      const isValidFormat = await validateCustomIdFormat(inventoryId, parsed.customId);
      if (!isValidFormat) {
        return res.status(400).json({ 
          message: 'Custom ID does not match the defined format for this inventory' 
        });
      }
    }

    // Check if customId is unique within this inventory
    const existingItem = await prisma.item.findUnique({
      where: {
        inventoryId_customId: { inventoryId, customId: parsed.customId }
      }
    });

    if (existingItem) {
      return res.status(409).json({ 
        message: 'Item with this custom ID already exists in this inventory' 
      });
    }

    // Create the item
    const item = await prisma.item.create({
      data: {
        inventoryId,
        userId: user.id,
        customId: parsed.customId,
        values: parsed.values as any,
        version: parsed.version
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inventory: { select: { title: true } }
      }
    });

    res.status(201).json(item);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to create item' });
  }
});

// Update item
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const parsed = updateItemSchema.parse(req.body);

    // Get the item and check permissions
    const item = await prisma.item.findUnique({
      where: { id },
      include: { inventory: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user can write to this inventory
    const canWrite = await canWriteToInventory(item.inventoryId, user.id);
    if (!canWrite) {
      return res.status(403).json({ message: 'No write access to this inventory' });
    }

    // Get inventory with custom ID parts for validation
    const inventory = await prisma.inventory.findUnique({
      where: { id: item.inventoryId },
      include: { customIdParts: { orderBy: { order: 'asc' } } }
    });

    // Validate custom ID format if format is defined and customId is being changed
    if (parsed.customId && parsed.customId !== item.customId) {
      if (inventory?.customIdParts && inventory.customIdParts.length > 0) {
        const isValidFormat = await validateCustomIdFormat(item.inventoryId, parsed.customId);
        if (!isValidFormat) {
          return res.status(400).json({ 
            message: 'Custom ID does not match the defined format for this inventory' 
          });
        }
      }

      const existingItem = await prisma.item.findUnique({
        where: {
          inventoryId_customId: { 
            inventoryId: item.inventoryId, 
            customId: parsed.customId 
          }
        }
      });

      if (existingItem) {
        return res.status(409).json({ 
          message: 'Item with this custom ID already exists in this inventory' 
        });
      }
    }

    // Optimistic locking update
    const updatedItem = await prisma.item.updateMany({
      where: { 
        id, 
        version: parsed.version 
      },
      data: {
        customId: parsed.customId || item.customId,
        values: (parsed.values || item.values) as any,
        version: { increment: 1 }
      }
    });

    if (updatedItem.count === 0) {
      return res.status(409).json({ 
        message: 'Version conflict. Please reload and try again.' 
      });
    }

    // Get the updated item
    const refreshedItem = await prisma.item.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        inventory: { select: { title: true } }
      }
    });

    res.json(refreshedItem);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Get the item and check permissions
    const item = await prisma.item.findUnique({
      where: { id },
      include: { inventory: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user can write to this inventory
    const canWrite = await canWriteToInventory(item.inventoryId, user.id);
    if (!canWrite) {
      return res.status(403).json({ message: 'No write access to this inventory' });
    }

    // Delete the item (cascade will handle comments and likes)
    await prisma.item.delete({ where: { id } });

    res.json({ message: 'Item deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// Toggle like on item
router.post('/:id/like', ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Check if item exists
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user already liked this item
    const existingLike = await prisma.like.findUnique({
      where: {
        itemId_userId: { itemId: id, userId: user.id }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      res.json({ message: 'Like removed', liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          itemId: id,
          userId: user.id
        }
      });
      res.json({ message: 'Item liked', liked: true });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// Add comment to item
router.post('/:id/comments', ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id },
      select: { id: true, inventoryId: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        itemId: id,
        userId: user.id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// Update comment (only by comment author)
router.put('/:id/comments/:commentId', ensureAuth, async (req, res) => {
  try {
    const { id: itemId, commentId } = req.params;
    const user = (req as any).user;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if comment exists and belongs to user
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        itemId: itemId,
        userId: user.id
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found or access denied' });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updatedComment);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

// Delete comment (only by comment author or admin)
router.delete('/:id/comments/:commentId', ensureAuth, async (req, res) => {
  try {
    const { id: itemId, commentId } = req.params;
    const user = (req as any).user;

    // Check if comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        itemId: itemId
      },
      include: {
        user: { select: { id: true } }
      }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user can delete (author or admin)
    if (comment.user.id !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// Get comments for an item (with pagination)
router.get('/:id/comments', async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Check if item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Get comments with pagination
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { itemId },
        include: {
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.comment.count({ where: { itemId } })
    ]);

    res.json({
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Helper function to validate custom ID format
async function validateCustomIdFormat(inventoryId: string, customId: string): Promise<boolean> {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: { customIdParts: { orderBy: { order: 'asc' } } }
  });

  if (!inventory?.customIdParts?.length) {
    return true; // No format set, any ID is valid
  }

  const parts = inventory.customIdParts;
  let pattern = '';
  
  for (const part of parts) {
    switch (part.type) {
      case 'FIXED':
        pattern += (part.format || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        break;
      case 'RANDOM6':
        pattern += '[A-Za-z0-9]{6}';
        break;
      case 'RANDOM9':
        pattern += '[A-Za-z0-9]{9}';
        break;
      case 'RANDOM20':
        pattern += '[A-Za-z0-9]{20}';
        break;
      case 'RANDOM32':
        pattern += '[A-Za-z0-9]{32}';
        break;
      case 'GUID':
        pattern += '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
        break;
      case 'DATE':
        pattern += '\\d{4}-\\d{2}-\\d{2}';
        break;
      case 'SEQUENCE':
        pattern += '\\d+';
        break;
      default:
        return false; // Unknown type
    }
  }

  const regex = new RegExp(`^${pattern}$`, 'i');
  return regex.test(customId);
}

export default router;