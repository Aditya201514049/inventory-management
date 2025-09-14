import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import salesforceService from '../services/salesforce';
import { z } from 'zod';

const router = Router();

// Validation schema for Salesforce user data
const salesforceUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

// Test Salesforce connection
router.get('/test', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    // Only allow admins or the user themselves to test connection
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required for connection test' });
    }

    const isConnected = await salesforceService.testConnection();
    
    res.json({ 
      connected: isConnected,
      message: isConnected ? 'Salesforce connection successful' : 'Salesforce connection failed'
    });
  } catch (error: any) {
    console.error('Salesforce connection test error:', error);
    res.status(500).json({ 
      connected: false,
      message: 'Connection test failed',
      error: error.message 
    });
  }
});

// Create Salesforce Account and Contact
router.post('/create-account-contact', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    console.log('=== Salesforce Account/Contact Creation Debug ===');
    console.log('User:', { id: user.id, email: user.email, isAdmin: user.isAdmin });
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Validate request body
    const validationResult = salesforceUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.issues);
      return res.status(400).json({ 
        message: 'Invalid data provided',
        errors: validationResult.error.issues 
      });
    }

    const userData = validationResult.data;
    console.log('Validated user data:', JSON.stringify(userData, null, 2));

    // Ensure the email matches the current user's email (security check)
    if (userData.email !== user.email && !user.isAdmin) {
      console.log('Security check failed: email mismatch');
      return res.status(403).json({ 
        message: 'You can only create Salesforce records for your own email address' 
      });
    }

    console.log('Starting Salesforce Account/Contact creation...');
    
    // Create Account and Contact in Salesforce
    const result = await salesforceService.createAccountAndContact(userData);
    
    console.log('Salesforce creation successful:', result);

    // Log the action for audit purposes
    console.log(`User ${user.email} created Salesforce Account (${result.accountId}) and Contact (${result.contactId})`);

    res.json({
      success: true,
      message: 'Successfully created Salesforce Account and Contact',
      accountId: result.accountId,
      contactId: result.contactId,
      salesforceUrl: `https://login.salesforce.com/lightning/r/Contact/${result.contactId}/view`
    });

  } catch (error: any) {
    console.error('=== Salesforce Error Details ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    if (error.message.includes('Missing Salesforce credentials')) {
      console.error('Environment variables check:');
      console.error('SALESFORCE_USERNAME:', process.env.SALESFORCE_USERNAME ? 'SET' : 'MISSING');
      console.error('SALESFORCE_PASSWORD:', process.env.SALESFORCE_PASSWORD ? 'SET' : 'MISSING');
      console.error('SALESFORCE_SECURITY_TOKEN:', process.env.SALESFORCE_SECURITY_TOKEN ? 'SET' : 'MISSING');
      console.error('SALESFORCE_CONSUMER_KEY:', process.env.SALESFORCE_CONSUMER_KEY ? 'SET' : 'MISSING');
      console.error('SALESFORCE_CONSUMER_SECRET:', process.env.SALESFORCE_CONSUMER_SECRET ? 'SET' : 'MISSING');
    }
    
    // Return user-friendly error messages
    let errorMessage = 'Failed to create Salesforce records';
    if (error.message.includes('authentication')) {
      errorMessage = 'Salesforce authentication failed. Please check configuration.';
    } else if (error.message.includes('DUPLICATE_VALUE')) {
      errorMessage = 'A record with this email already exists in Salesforce.';
    } else if (error.message.includes('REQUIRED_FIELD_MISSING')) {
      errorMessage = 'Required fields are missing. Please fill in all required information.';
    } else if (error.message.includes('Missing Salesforce credentials')) {
      errorMessage = 'Salesforce credentials are not properly configured.';
    }

    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's existing Salesforce records (optional feature)
router.get('/user-records', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    
    // This is a placeholder for future functionality
    // You could implement a search for existing contacts by email
    res.json({
      message: 'Feature not implemented yet',
      userEmail: user.email
    });

  } catch (error: any) {
    console.error('Error fetching Salesforce user records:', error);
    res.status(500).json({ 
      message: 'Failed to fetch Salesforce records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Initiate Salesforce OAuth flow
router.get('/auth', (req, res) => {
  const clientId = process.env.SALESFORCE_CONSUMER_KEY;
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL 
    : (process.env.BACKEND_URL || 'http://localhost:4000');
  const redirectUri = `${baseUrl}/api/salesforce/callback`;
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
  
  if (!clientId) {
    return res.status(500).json({ error: 'Salesforce Consumer Key not configured' });
  }

  const authUrl = `${loginUrl}/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=api%20refresh_token`;

  console.log('Redirecting to Salesforce OAuth:', authUrl);
  console.log('Using callback URL:', redirectUri);
  res.redirect(authUrl);
});

// Handle Salesforce OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('Salesforce OAuth error:', error);
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? process.env.PRODUCTION_FRONTEND_URL 
        : (process.env.FRONTEND_URL || 'http://localhost:3000');
      return res.redirect(`${frontendUrl}/profile?salesforce_error=${encodeURIComponent(error as string)}`);
    }

    if (!code) {
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? process.env.PRODUCTION_FRONTEND_URL 
        : (process.env.FRONTEND_URL || 'http://localhost:3000');
      return res.redirect(`${frontendUrl}/profile?salesforce_error=no_code`);
    }

    const clientId = process.env.SALESFORCE_CONSUMER_KEY;
    const clientSecret = process.env.SALESFORCE_CONSUMER_SECRET;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_URL 
      : (process.env.BACKEND_URL || 'http://localhost:4000');
    const redirectUri = `${baseUrl}/api/salesforce/callback`;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      const frontendUrl = process.env.NODE_ENV === 'production' 
        ? process.env.PRODUCTION_FRONTEND_URL 
        : (process.env.FRONTEND_URL || 'http://localhost:3000');
      return res.redirect(`${frontendUrl}/profile?salesforce_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Salesforce OAuth successful:', { 
      instance_url: (tokenData as any).instance_url,
      token_type: (tokenData as any).token_type 
    });

    // Store tokens in session or return to frontend
    // For now, redirect back to frontend with success
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_FRONTEND_URL 
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    res.redirect(`${frontendUrl}/profile?salesforce_success=true`);
    
  } catch (error) {
    console.error('Salesforce callback error:', error);
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_FRONTEND_URL 
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    res.redirect(`${frontendUrl}/profile?salesforce_error=callback_failed`);
  }
});

export default router;
