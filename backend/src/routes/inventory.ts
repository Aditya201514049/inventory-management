import { Router } from 'express';
import prisma from '../prisma';
import { ensureAuth } from '../middleware/ensureAuth';
import { z } from 'zod';

const router = Router();

const CustomIdType = z.enum([
  'FIXED',
  'RANDOM20',
  'RANDOM32',
  'RANDOM6',
  'RANDOM9',
  'GUID',
  'DATE',
  'SEQUENCE',
]);

const customIdPartSchema = z.object({
  type: CustomIdType,
  format: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

const createInventorySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
  customIdParts: z.array(customIdPartSchema).optional().default([]),
});

const updateInventorySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  version: z.number().int().positive(), // optimistic locking
  customIdParts: z.array(customIdPartSchema).optional(),
});

// List inventories with search and filtering
router.get('/', async (req, res) => {
  const { search, category, tag, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 20;
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  const user = (req as any).user;
  
  // Access control: Enhanced for admin users
  if (!user) {
    // Non-authenticated users only see public inventories
    where.isPublic = true;
  } else if (user.isAdmin) {
    // Admin users see ALL inventories (no filtering)
    // where remains empty to show everything
  } else {
    // Regular authenticated users see public inventories + their own + ones they have access to
    where.OR = [
      { isPublic: true },
      { ownerId: user.id },
      { accessList: { some: { userId: user.id } } }
    ];
  }
  
  // Full-text search across title, description, and tags
  if (search) {
    const searchConditions = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { tags: { hasSome: [search as string] } }
    ];
    
    // Combine search with access control
    if (where.OR) {
      where.AND = [
        { OR: where.OR },
        { OR: searchConditions }
      ];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  if (category) {
    where.categoryId = category;
  }

  if (tag) {
    where.tags = { has: tag as string };
  }

  const [inventories, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { owner: true, category: true },
      orderBy: { createdAt: 'desc' },
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
});

// Get current user's inventories - MUST be before the /:id route
router.get('/my', ensureAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    console.log('DEBUG: Fetching inventories for user ID:', userId);
    console.log('DEBUG: User object:', (req as any).user);
    
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // First, let's check all inventories to see what exists
    const allInventories = await prisma.inventory.findMany({
      select: { id: true, title: true, ownerId: true, owner: { select: { id: true, email: true } } }
    });
    console.log('DEBUG: All inventories in database:', allInventories);

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where: { ownerId: userId },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          category: true,
          _count: {
            select: { items: true, comments: true }
          }
        }
      }),
      prisma.inventory.count({ where: { ownerId: userId } })
    ]);

    console.log('DEBUG: Found inventories for user:', inventories);
    console.log('DEBUG: Total count:', total);

    res.json({
      data: inventories,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching user inventories:', error);
    res.status(500).json({ message: 'Failed to fetch inventories' });
  }
});

// Get single inventory (full detail)
router.get('/:id', async (req, res) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id: req.params.id },
    include: {
      owner: true,
      category: true,
      fields: true,
      customIdParts: { orderBy: { order: 'asc' } },
      accessList: { include: { user: true } },
      _count: {
        select: { items: true, comments: true }
      }
    },
  });
  if (!inventory) return res.status(404).json({ message: 'Not found' });
  res.json(inventory);
});

// Get inventory statistics
router.get('/:id/stats', async (req, res) => {
  const inventory = await prisma.inventory.findUnique({
    where: { id: req.params.id },
    include: {
      fields: true,
      items: {
        select: { values: true }
      }
    }
  });

  if (!inventory) return res.status(404).json({ message: 'Not found' });

  const stats: any = {
    totalItems: inventory.items.length,
    fieldStats: {}
  };

  // Calculate statistics for each field type
  for (const field of inventory.fields) {
    if (field.type === 'NUMBER') {
      const numbers = inventory.items
        .map(item => (item.values as any)[field.name])
        .filter(val => typeof val === 'number' && !isNaN(val));
      
      if (numbers.length > 0) {
        stats.fieldStats[field.name] = {
          type: 'number',
          count: numbers.length,
          min: Math.min(...numbers),
          max: Math.max(...numbers),
          average: numbers.reduce((a, b) => a + b, 0) / numbers.length
        };
      }
    } else if (field.type === 'STRING') {
      const values = inventory.items
        .map(item => (item.values as any)[field.name])
        .filter(val => typeof val === 'string' && val.length > 0);
      
      if (values.length > 0) {
        const valueCounts: Record<string, number> = {};
        values.forEach(val => {
          valueCounts[val] = (valueCounts[val] || 0) + 1;
        });
        
        const topValues = Object.entries(valueCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        
        stats.fieldStats[field.name] = {
          type: 'string',
          count: values.length,
          topValues,
          uniqueCount: Object.keys(valueCounts).length
        };
      }
    } else if (field.type === 'BOOLEAN') {
      const values = inventory.items
        .map(item => (item.values as any)[field.name])
        .filter(val => typeof val === 'boolean');
      
      if (values.length > 0) {
        const trueCount = values.filter(v => v === true).length;
        stats.fieldStats[field.name] = {
          type: 'boolean',
          count: values.length,
          trueCount,
          falseCount: values.length - trueCount
        };
      }
    }
  }

  res.json(stats);
});

// Get tag autocomplete
router.get('/tags/autocomplete', async (req, res) => {
  const { prefix = '' } = req.query;
  
  const tags = await prisma.inventory.findMany({
    select: { tags: true },
    where: {
      tags: { hasSome: [prefix as string] }
    }
  });

  const allTags = tags.flatMap(inv => inv.tags);
  const uniqueTags = [...new Set(allTags)]
    .filter(tag => tag.toLowerCase().startsWith((prefix as string).toLowerCase()))
    .sort()
    .slice(0, 10);

  res.json(uniqueTags);
});

// Get popular inventories (top 5 by item count)
router.get('/popular/top5', async (req, res) => {
  const popular = await prisma.inventory.findMany({
    include: {
      owner: true,
      category: true,
      _count: { select: { items: true } }
    },
    orderBy: { items: { _count: 'desc' } },
    take: 5
  });

  res.json(popular);
});

// Create inventory (owner or any authenticated user)
router.post('/', ensureAuth, async (req, res) => {
  try {
    const parsed = createInventorySchema.parse(req.body);
    const user = (req as any).user;
    
    // Validate custom ID parts
    if (parsed.customIdParts && parsed.customIdParts.length > 0) {
      const validationError = validateCustomIdParts(parsed.customIdParts);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    const created = await prisma.inventory.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        categoryId: parsed.categoryId ?? null,
        imageUrl: parsed.imageUrl,
        tags: parsed.tags ?? [],
        isPublic: parsed.isPublic ?? false,
        ownerId: user.id,
        customIdParts: parsed.customIdParts?.length
          ? {
              create: parsed.customIdParts.map(p => ({
                type: p.type,
                format: p.format ?? null,
                order: p.order,
              })),
            }
          : undefined,
      },
      include: {
        owner: true,
        category: true,
        customIdParts: { orderBy: { order: 'asc' } },
      },
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to create inventory' });
  }
});

// Update inventory (owner or admin), with optimistic locking
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    const parsed = updateInventorySchema.parse(req.body);
    const user = (req as any).user;

    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true, version: true },
    });
    if (!inv) return res.status(404).json({ message: 'Not found' });

    // Enhanced access control: Owner or admin can edit inventory settings
    if (inv.ownerId !== user.id && !user.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Only inventory owner or admin can edit this inventory' });
    }

    // Validate custom ID parts if provided
    if (parsed.customIdParts !== undefined) {
      const validationError = validateCustomIdParts(parsed.customIdParts);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    // Build update data
    const updateData: any = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId ?? null;
    if (parsed.imageUrl !== undefined) updateData.imageUrl = parsed.imageUrl ?? null;
    if (parsed.tags !== undefined) updateData.tags = parsed.tags;
    if (parsed.isPublic !== undefined) updateData.isPublic = parsed.isPublic;

    // Perform optimistic update and parts replacement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory row only if version matches; increment version
      const updatedCount = await tx.inventory.updateMany({
        where: { id: req.params.id, version: parsed.version },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
      });

      if (updatedCount.count !== 1) {
        return { conflict: true } as const;
      }

      // Replace customIdParts if provided - this is safe because we're in a transaction
      if (parsed.customIdParts !== undefined) {
        await tx.customIdPart.deleteMany({ where: { inventoryId: req.params.id } });
        if (parsed.customIdParts.length > 0) {
          await tx.customIdPart.createMany({
            data: parsed.customIdParts.map(p => ({
              inventoryId: req.params.id,
              type: p.type,
              format: p.format ?? null,
              order: p.order,
            })),
          });
        }
      }

      const refreshed = await tx.inventory.findUnique({
        where: { id: req.params.id },
        include: {
          owner: true,
          category: true,
          customIdParts: { orderBy: { order: 'asc' } },
        },
      });
      return { conflict: false, data: refreshed } as const;
    });

    if (result.conflict) {
      return res.status(409).json({ message: 'Version conflict. Please reload and try again.' });
    }

    res.json(result.data);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to update inventory' });
  }
});

// Delete inventory (owner or admin)
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    console.log('Delete request - User:', { id: user.id, isAdmin: user.isAdmin });
    
    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true },
    });
    if (!inv) return res.status(404).json({ message: 'Not found' });

    console.log('Inventory to delete:', { id: inv.id, ownerId: inv.ownerId });
    console.log('Access check:', { isOwner: inv.ownerId === user.id, isAdmin: user.isAdmin });

    // Enhanced access control: Owner or admin can delete inventory
    if (inv.ownerId !== user.id && !user.isAdmin) {
      console.log('Delete forbidden - not owner and not admin');
      return res.status(403).json({ message: 'Forbidden: Only inventory owner or admin can delete this inventory' });
    }

    console.log('Delete authorized - proceeding');
    
    // Delete inventory and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first to avoid foreign key constraints
      await tx.like.deleteMany({ where: { item: { inventoryId: req.params.id } } });
      await tx.comment.deleteMany({ where: { inventoryId: req.params.id } });
      await tx.item.deleteMany({ where: { inventoryId: req.params.id } });
      await tx.access.deleteMany({ where: { inventoryId: req.params.id } });
      await tx.field.deleteMany({ where: { inventoryId: req.params.id } });
      await tx.customIdPart.deleteMany({ where: { inventoryId: req.params.id } });
      
      // Finally delete the inventory
      await tx.inventory.delete({ where: { id: req.params.id } });
    });
    
    res.json({ message: 'Inventory deleted successfully' });
  } catch (err: any) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ message: 'Failed to delete inventory' });
  }
});

// Generate custom ID based on format
router.post('/:id/generate-id', ensureAuth, async (req, res) => {
  try {
    const { id: inventoryId } = req.params;
    const { customIdParts } = req.body;

    if (!customIdParts || !Array.isArray(customIdParts) || customIdParts.length === 0) {
      return res.status(400).json({ message: 'Custom ID parts are required' });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { customIdParts: { orderBy: { order: 'asc' } } }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Generate custom ID based on parts
    let generatedId = '';
    
    for (const part of customIdParts) {
      switch (part.type) {
        case 'FIXED':
          generatedId += part.format || '';
          break;
          
        case 'RANDOM6':
          generatedId += generateRandomString(6);
          break;
          
        case 'RANDOM9':
          generatedId += generateRandomString(9);
          break;
          
        case 'RANDOM20':
          generatedId += generateRandomString(20);
          break;
          
        case 'RANDOM32':
          generatedId += generateRandomString(32);
          break;
          
        case 'GUID':
          generatedId += generateGUID();
          break;
          
        case 'DATE':
          generatedId += new Date().toISOString().split('T')[0]; // YYYY-MM-DD
          break;
          
        case 'SEQUENCE':
          // Get the next sequence number for this inventory
          const lastItem = await prisma.item.findFirst({
            where: { inventoryId },
            orderBy: { sequence: 'desc' },
            select: { sequence: true }
          });
          const nextSequence = (lastItem?.sequence || 0) + 1;
          generatedId += nextSequence.toString().padStart(3, '0'); // 3-digit padding
          break;
          
        default:
          return res.status(400).json({ message: `Unknown custom ID type: ${part.type}` });
      }
    }

    // Check if generated ID already exists
    const existingItem = await prisma.item.findUnique({
      where: {
        inventoryId_customId: { inventoryId, customId: generatedId }
      }
    });

    if (existingItem) {
      // If ID exists, try generating again (recursive call with limit)
      return res.status(409).json({ 
        message: 'Generated ID already exists, please try again',
        customId: generatedId 
      });
    }

    res.json({ customId: generatedId });

  } catch (error) {
    console.error('Generate ID error:', error);
    res.status(500).json({ message: 'Failed to generate custom ID' });
  }
});

// Helper functions for ID generation
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateGUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Validate custom ID against format
router.post('/:id/validate-id', ensureAuth, async (req, res) => {
  try {
    const { id: inventoryId } = req.params;
    const { customId } = req.body;

    if (!customId) {
      return res.status(400).json({ message: 'Custom ID is required' });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { customIdParts: { orderBy: { order: 'asc' } } }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (!inventory.customIdParts || inventory.customIdParts.length === 0) {
      return res.json({ valid: true, message: 'No format defined' });
    }

    // Check if custom ID already exists
    const existingItem = await prisma.item.findUnique({
      where: {
        inventoryId_customId: { inventoryId, customId }
      }
    });

    if (existingItem) {
      return res.json({ 
        valid: false, 
        message: 'Custom ID already exists in this inventory' 
      });
    }

    // Validate format (simplified - you can make this more sophisticated)
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
      }
    }

    const regex = new RegExp(`^${pattern}$`, 'i');
    const isValid = regex.test(customId);

    res.json({ 
      valid: isValid, 
      message: isValid ? 'Valid format' : 'Custom ID does not match the defined format' 
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ message: 'Failed to validate custom ID' });
  }
});

// Helper function to validate custom ID parts
function validateCustomIdParts(parts: any[]): string | null {
  if (parts.length > 10) {
    return 'Maximum 10 custom ID parts allowed';
  }

  // Check for duplicate orders
  const orders = parts.map(p => p.order);
  if (new Set(orders).size !== orders.length) {
    return 'Duplicate order values found in custom ID parts';
  }

  // Validate format strings for specific types
  for (const part of parts) {
    if (part.type === 'DATE' && part.format) {
      // Basic date format validation - you could make this more sophisticated
      const validFormats = ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss', 'ddd', 'MMM'];
      const formatParts = part.format.match(/[a-zA-Z]+/g) || [];
      for (const formatPart of formatParts) {
        if (!validFormats.includes(formatPart)) {
          return `Invalid date format: ${formatPart}`;
        }
      }
    }
    
    if (part.type === 'SEQUENCE' && part.format) {
      // Sequence format should be like D3, D4, etc.
      if (!/^D\d*$/.test(part.format)) {
        return 'Invalid sequence format. Use D for no padding, D3 for 3-digit padding, etc.';
      }
    }
  }

  return null;
}


export default router;