import { Router } from 'express';
import prisma from '../prisma';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';

const router = Router();

function ensureAdmin(req: any, res: any, next: any) {
  if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin access required' });
  next();
}

// List categories (with inventory counts)
router.get('/', async (req, res) => {
  const { search = '' } = req.query as { search?: string };
  const where = search
    ? { name: { contains: String(search), mode: 'insensitive' as const} }
    : undefined;

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { _count: { select: { inventories: true } } },
  });

  res.json(categories);
});

// Popular categories (top N by inventory count)
router.get('/popular', async (req, res) => {
  const take = Number(req.query.take ?? 5) || 5;
  const categories = await prisma.category.findMany({
    include: { _count: { select: { inventories: true } } },
    orderBy: { inventories: { _count: 'desc' } },
    take,
  });
  res.json(categories);
});

// Create category (admin only)
router.post('/', jwtAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });

  try {
    const cat = await prisma.category.create({
      data: { name: name.trim() },
    });
    res.status(201).json(cat);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ message: 'Category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Delete category (admin only) — inventories get categoryId set to NULL (per FK rule)
router.delete('/:id', jwtAuth, ensureAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch (e: any) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Optional: seed defaults (admin only, idempotent)
router.post('/seed', jwtAuth, ensureAdmin, async (_req: AuthenticatedRequest, res) => {
  const defaults = ['Equipment', 'Furniture', 'Books', 'Documents', 'Other'];
  for (const n of defaults) {
    try {
      await prisma.category.create({ data: { name: n } });
    } catch (e: any) {
      // ignore duplicates (unique name)
      if (e?.code !== 'P2002') throw e;
    }
  }
  const all = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json({ message: 'Seeded', categories: all });
});

export default router;