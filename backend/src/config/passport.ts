import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../prisma";

// Serialize user into session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, undefined);
  }
});

// ----------------- Google OAuth -----------------
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/google/callback`, // update port if needed
    },
    async (_, __, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email from Google"), undefined);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  ));
} else {
  console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

// ----------------- GitHub OAuth -----------------
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/github/callback`, // update port if needed
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        let email = profile.emails?.[0]?.value;
        
        // If no email from profile, try to get primary email from GitHub API
        if (!email && _accessToken) {
          try {
            const fetch = (await import('node-fetch')).default;
            const emailResponse = await fetch('https://api.github.com/user/emails', {
              headers: {
                'Authorization': `token ${_accessToken}`,
                'User-Agent': 'inventory-management-app'
              }
            });
            const emails = await emailResponse.json() as any[];
            const primaryEmail = emails.find(e => e.primary && e.verified);
            email = primaryEmail?.email;
          } catch (apiError) {
            console.log('Could not fetch email from GitHub API:', apiError);
          }
        }
        
        // If still no email, use username@github.local as fallback
        if (!email) {
          email = `${profile.username}@github.local`;
          console.log(`No email available for GitHub user ${profile.username}, using fallback: ${email}`);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username,
            },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  ));
} else {
  console.log("GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
}

export default passport;
