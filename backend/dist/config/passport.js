"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const prisma_1 = __importDefault(require("../prisma"));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (err) {
        done(err, undefined);
    }
});
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/google/callback`,
    }, async (_, __, profile, done) => {
        try {
            const email = profile.emails?.[0].value;
            if (!email)
                return done(new Error("No email from Google"), undefined);
            let user = await prisma_1.default.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma_1.default.user.create({
                    data: {
                        email,
                        name: profile.displayName,
                    },
                });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err, undefined);
        }
    }));
}
else {
    console.log("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/auth/github/callback`,
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            let email = profile.emails?.[0]?.value;
            if (!email && _accessToken) {
                try {
                    const fetch = (await Promise.resolve().then(() => __importStar(require('node-fetch')))).default;
                    const emailResponse = await fetch('https://api.github.com/user/emails', {
                        headers: {
                            'Authorization': `token ${_accessToken}`,
                            'User-Agent': 'inventory-management-app'
                        }
                    });
                    const emails = await emailResponse.json();
                    const primaryEmail = emails.find(e => e.primary && e.verified);
                    email = primaryEmail?.email;
                }
                catch (apiError) {
                    console.log('Could not fetch email from GitHub API:', apiError);
                }
            }
            if (!email) {
                email = `${profile.username}@github.local`;
                console.log(`No email available for GitHub user ${profile.username}, using fallback: ${email}`);
            }
            let user = await prisma_1.default.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma_1.default.user.create({
                    data: {
                        email,
                        name: profile.displayName || profile.username,
                    },
                });
            }
            return done(null, user);
        }
        catch (err) {
            return done(err, undefined);
        }
    }));
}
else {
    console.log("GitHub OAuth not configured - missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
}
exports.default = passport_1.default;
