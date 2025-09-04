"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuth = ensureAuth;
function ensureAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    res.redirect(`${process.env.FRONTEND_URL}/login`);
}
