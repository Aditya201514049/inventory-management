import express from 'express';
import { Request, Response } from 'express';
import { ensureAuth } from '../middleware/ensureAuth';

const router = express.Router();

// Get current user's profile
router.get('/profile', ensureAuth, (req: Request, res: Response) => {
  // The user is available in req.user after authentication
  res.json({ user: req.user });
});

export default router;
