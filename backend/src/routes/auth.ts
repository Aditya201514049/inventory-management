import { Router } from "express";
import passport from "../config/passport";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

// Google login
router.get("/google", passport.authenticate("google", { 
  scope: ["profile", "email"] 
}));

router.get("/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${FRONTEND_URL}/login` 
  }),
  (req, res) => {
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
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect(`${FRONTEND_URL}/`);
  });
});

export default router;