import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/tags', async (_req, res) => {
    const rows = await prisma.inventory.findMany({ select: { tags: true } });
    const unique = [...new Set(rows.flatMap(r => r.tags))].sort();
    res.json(unique);
  });
  
  // GET /api/tags/stats
  router.get('/tags/stats', async (_req, res) => {
    const rows = await prisma.inventory.findMany({ select: { tags: true } });
    const counts = new Map<string, number>();
    for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) || 0) + 1);
    const stats = [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a,b)=>b.count-a.count).slice(0, 50);
    res.json(stats);
  });

export default router;