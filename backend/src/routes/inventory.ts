import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req, res) => {
  const inventories = await prisma.inventory.findMany({
    include: { owner: true, category: true }
  });
  res.json(inventories);
});

export default router;