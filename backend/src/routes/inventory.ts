import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const inventories = await prisma.inventory.findMany({
    include: { owner: true, category: true }
  });
  res.json(inventories);
});

export default router;