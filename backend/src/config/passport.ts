import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../prisma";

// IMPORTANT: These are needed even with JWT for OAuth flow
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id } 
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Helper function for callback URLs
const getCallbackURL = (provider: string) => {
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.BACKEND_URL}/auth/${provider}/callback`;
  }
  return `http://localhost:4000/auth/${provider}/callback`;
};

// ----------------- Google OAuth -----------------
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL('google'),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback triggered for:', profile.displayName);
        
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('No email from Google profile');
          return done(new Error("No email from Google"), undefined);
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          console.log('Creating new user for:', email);
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
            },
          });
        } else {
          console.log('Found existing user:', email);
        }

        return done(null, user);
      } catch (err) {
        console.error('Google OAuth error:', err);
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
      callbackURL: getCallbackURL('github'),
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('GitHub OAuth callback triggered for:', profile.username);
        
        let email = profile.emails?.[0]?.value;
        
        // If no email from profile, try to get primary email from GitHub API
        if (!email && accessToken) {
          try {
            const fetch = (await import('node-fetch')).default;
            const emailResponse = await fetch('https://api.github.com/user/emails', {
              headers: {
                'Authorization': `token ${accessToken}`,
                'User-Agent': 'inventory-management-app'
              }
            });
            
            if (emailResponse.ok) {
              const emails = await emailResponse.json() as any[];
              const primaryEmail = emails.find(e => e.primary && e.verified);
              email = primaryEmail?.email;
            }
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
          console.log('Creating new user for:', email);
          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName || profile.username,
            },
          });
        } else {
          console.log('Found existing user:', email);
        }

        return done(null, user);
      } catch (err) {
        console.error('GitHub OAuth error:', err);
        return done(err as Error, undefined);
      }
    }
  ));
} else {
  console.log("GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
}

export default passport;