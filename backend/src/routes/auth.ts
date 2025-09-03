import { Router } from "express";
import passport from "../config/passport";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google login
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"] 
}));

router.get("/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${FRONTEND_URL}/login` 
  }),
  (req, res) => {
    // Redirect to frontend dashboard after successful login
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

// GitHub login
router.get("/github", passport.authenticate("github", { 
  scope: ["user:email"] 
}));

router.get("/github/callback",
  passport.authenticate("github", { 
    failureRedirect: `${FRONTEND_URL}/login` 
  }),
  (req, res) => {
    // Redirect to frontend dashboard after successful login
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    // Redirect to frontend login page after logout
    res.redirect(`${FRONTEND_URL}/login`);
  });
});

export default router;