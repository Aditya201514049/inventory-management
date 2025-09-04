import { Request, Response, NextFunction } from "express";

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  // Check if this is an API request (JSON expected)
  if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  res.redirect(`${process.env.FRONTEND_URL}/login`);
}
