import { Router } from "express";
import passport from "../config/passport";
import { generateToken } from "../utils/jwt";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google login
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"] 
}));

router.get("/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false // Disable session for JWT
  }),
  (req, res) => {
    console.log('=== OAUTH CALLBACK SUCCESS ===');
    console.log('User:', req.user);
    
    if (!req.user) {
      console.log('No user found, redirecting to login');
      return res.redirect(`${FRONTEND_URL}/login`);
    }

    // Generate JWT token
    const token = generateToken({
      userId: (req.user as any).id,
      email: (req.user as any).email,
      name: (req.user as any).name
    });

    console.log('Generated JWT token, redirecting to dashboard');
    // Redirect to frontend with token as query parameter
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// GitHub login
router.get("/github", passport.authenticate("github", { 
  scope: ["user:email"] 
}));

router.get("/github/callback",
  passport.authenticate("github", { 
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false // Disable session for JWT
  }),
  (req, res) => {
    console.log('=== GITHUB OAUTH CALLBACK SUCCESS ===');
    console.log('User:', req.user);
    
    if (!req.user) {
      console.log('No user found, redirecting to login');
      return res.redirect(`${FRONTEND_URL}/login`);
    }

    // Generate JWT token
    const token = generateToken({
      userId: (req.user as any).id,
      email: (req.user as any).email,
      name: (req.user as any).name
    });

    console.log('Generated JWT token, redirecting to dashboard');
    // Redirect to frontend with token as query parameter
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// Logout (JWT doesn't need server-side logout, just client-side token removal)
router.post("/logout", (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // Server doesn't need to do anything
  res.json({ message: 'Logged out successfully' });
});

export default router;