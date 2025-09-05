import { Router } from 'express';
import prisma from '../prisma';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const fieldTypeSchema = z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'TEXT', 'LINK']);

const createFieldSchema = z.object({
  name: z.string().min(1).max(50),
  type: fieldTypeSchema,
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visible: z.boolean().default(true),
  validation: z.object({
    required: z.boolean().default(false),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    regex: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    options: z.array(z.string()).optional(), // For SELECT type
  }).optional(),
  order: z.number().int().min(0)
});

const updateFieldSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: fieldTypeSchema.optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visible: z.boolean().optional(),
  validation: z.object({
    required: z.boolean().optional(),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    regex: z.string().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
  order: z.number().int().min(0).optional()
});

// Helper function to check field limits per inventory
async function checkFieldLimits(inventoryId: string, fieldType: string): Promise<boolean> {
  const existingCount = await prisma.field.count({
    where: { 
      inventoryId, 
      type: fieldType as any 
    }
  });
  
  // Maximum 3 fields of each type
  return existingCount < 3;
}

// Helper function to check if user can manage fields
async function canManageFields(inventoryId: string, userId: string): Promise<boolean> {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    select: { ownerId: true, isPublic: true }
  });

  if (!inventory) return false;
  
  // Owner can always manage
  if (inventory.ownerId === userId) return true;
  
  // Check explicit access
  const access = await prisma.access.findUnique({
    where: {
      inventoryId_userId: { inventoryId, userId }
    }
  });
  
  return access?.canWrite || false;
}

// List all fields for an inventory
router.get('/inventory/:inventoryId', async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, title: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const fields = await prisma.field.findMany({
      where: { inventoryId },
      orderBy: { order: 'asc' }
    });

    res.json({
      inventory: { id: inventory.id, title: inventory.title },
      fields
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch fields' });
  }
});

// Create new field
router.post('/inventory/:inventoryId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { inventoryId } = req.params;
    const user = req.user;
    const parsed = createFieldSchema.parse(req.body);

    // Check if user can manage fields
    const canManage = await canManageFields(inventoryId, user.id);
    if (!canManage) {
      return res.status(403).json({ message: 'No permission to manage fields' });
    }

    // Check field type limits
    const canAdd = await checkFieldLimits(inventoryId, parsed.type);
    if (!canAdd) {
      return res.status(400).json({ 
        message: `Maximum 3 fields of type ${parsed.type} allowed` 
      });
    }

    // Check if field name is unique within inventory
    const existingField = await prisma.field.findFirst({
      where: { 
        inventoryId, 
        name: parsed.name 
      }
    });

    if (existingField) {
      return res.status(409).json({ 
        message: 'Field name must be unique within inventory' 
      });
    }

    // Create field
    const field = await prisma.field.create({
      data: {
        inventoryId,
        name: parsed.name,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        visible: parsed.visible,
        validation: parsed.validation as any,
        order: parsed.order
      }
    });

    res.status(201).json(field);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to create field' });
  }
});

// Update field
router.put('/:fieldId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { fieldId } = req.params;
    const user = req.user;
    const parsed = updateFieldSchema.parse(req.body);

    // Get field and check permissions
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { inventory: true }
    });

    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Check if user can manage fields
    const canManage = await canManageFields(field.inventoryId, user.id);
    if (!canManage) {
      return res.status(403).json({ message: 'No permission to manage fields' });
    }

    // If changing type, check limits
    if (parsed.type && parsed.type !== field.type) {
      const canChange = await checkFieldLimits(field.inventoryId, parsed.type);
      if (!canChange) {
        return res.status(400).json({ 
          message: `Maximum 3 fields of type ${parsed.type} allowed` 
        });
      }
    }

    // If changing name, check uniqueness
    if (parsed.name && parsed.name !== field.name) {
      const existingField = await prisma.field.findFirst({
        where: { 
          inventoryId: field.inventoryId, 
          name: parsed.name,
          id: { not: fieldId }
        }
      });

      if (existingField) {
        return res.status(409).json({ 
          message: 'Field name must be unique within inventory' 
        });
      }
    }

    // Update field
    const updatedField = await prisma.field.update({
      where: { id: fieldId },
      data: {
        name: parsed.name,
        type: parsed.type,
        title: parsed.title,
        description: parsed.description,
        visible: parsed.visible,
        validation: parsed.validation as any,
        order: parsed.order
      }
    });

    res.json(updatedField);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', issues: err.issues });
    }
    res.status(500).json({ message: 'Failed to update field' });
  }
});

// Delete field
router.delete('/:fieldId', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { fieldId } = req.params;
    const user = req.user;

    // Get field and check permissions
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { inventory: true }
    });

    if (!field) {
      return res.status(404).json({ message: 'Field not found' });
    }

    // Check if user can manage fields
    const canManage = await canManageFields(field.inventoryId, user.id);
    if (!canManage) {
      return res.status(403).json({ message: 'No permission to manage fields' });
    }

    // Check if field is used in items
    const itemCount = await prisma.item.count({
      where: {
        inventoryId: field.inventoryId
      }
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete field that has values in existing items' 
      });
    }

    // Delete field
    await prisma.field.delete({ where: { id: fieldId } });

    res.json({ message: 'Field deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete field' });
  }
});

// Reorder fields (batch update)
router.put('/inventory/:inventoryId/reorder', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { inventoryId } = req.params;
    const user = req.user;
    const { fieldOrders } = req.body; // Array of { fieldId, order }

    if (!Array.isArray(fieldOrders)) {
      return res.status(400).json({ message: 'fieldOrders must be an array' });
    }

    // Check if user can manage fields
    const canManage = await canManageFields(inventoryId, user.id);
    if (!canManage) {
      return res.status(403).json({ message: 'No permission to manage fields' });
    }

    // Update all field orders in a transaction
    await prisma.$transaction(
      fieldOrders.map(({ fieldId, order }) =>
        prisma.field.update({
          where: { id: fieldId, inventoryId },
          data: { order }
        })
      )
    );

    // Get updated fields
    const fields = await prisma.field.findMany({
      where: { inventoryId },
      orderBy: { order: 'asc' }
    });

    res.json({ message: 'Fields reordered successfully', fields });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to reorder fields' });
  }
});

// Get field statistics for an inventory
router.get('/inventory/:inventoryId/stats', async (req, res) => {
  try {
    const { inventoryId } = req.params;

    // Check if inventory exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      select: { id: true, title: true }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const [fields, itemCount] = await Promise.all([
      prisma.field.findMany({
        where: { inventoryId },
        orderBy: { order: 'asc' }
      }),
      prisma.item.count({ where: { inventoryId } })
    ]);

    // Count fields by type
    const fieldTypeCounts = fields.reduce((acc, field) => {
      acc[field.type] = (acc[field.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count visible vs hidden fields
    const visibleCount = fields.filter(f => f.visible).length;
    const hiddenCount = fields.length - visibleCount;

    res.json({
      inventory: { id: inventory.id, title: inventory.title },
      totalFields: fields.length,
      fieldTypeCounts,
      visibleFields: visibleCount,
      hiddenFields: hiddenCount,
      totalItems: itemCount,
      fields: fields.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        title: f.title,
        visible: f.visible,
        order: f.order
      }))
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch field statistics' });
  }
});

export default router;