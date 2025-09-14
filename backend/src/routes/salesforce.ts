import { Router } from 'express';
import { jwtAuth, AuthenticatedRequest } from '../middleware/jwtAuth';
import salesforceService from '../services/salesforce';
import { z } from 'zod';

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

const router = Router();

// Test route to verify Salesforce routes are working
router.get('/test-route', (req, res) => {
  console.log('=== SALESFORCE TEST ROUTE HIT ===');
  res.json({ message: 'Salesforce routes are working', timestamp: new Date().toISOString() });
});

// Add authentication status endpoint
router.get('/auth-status', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    const userId = user.id.toString();
    
    console.log('=== Auth Status Check ===');
    console.log('User ID:', userId);
    
    // Check if user has valid OAuth tokens
    const hasTokens = salesforceService.hasValidTokensForUser(userId);
    console.log('Has valid tokens:', hasTokens);
    
    res.json({ 
      authenticated: hasTokens,
      userId: userId
    });
  } catch (error: unknown) {
    console.error('Auth status check error:', error);
    res.status(500).json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
  } catch (error: unknown) {
    console.error('Salesforce connection test error:', error);
    res.status(500).json({ 
      connected: false,
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
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
    
    try {
      // Create Account and Contact in Salesforce using OAuth tokens
      const result = await salesforceService.createAccountAndContactWithOAuth(userData, user.id);
      
      console.log('Salesforce creation successful:', result);

      // Log the action for audit purposes
      console.log(`User ${user.email} created Salesforce Account (${result.accountId}) and Contact (${result.contactId})`);

      res.json({
        success: true,
        message: 'Account and Contact created successfully in Salesforce',
        accountId: result.accountId,
        contactId: result.contactId,
        salesforceUrl: result.salesforceUrl
      });
    } catch (error: unknown) {
      console.error('=== Salesforce OAuth Creation Error ===');
      console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown error');
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
      console.error('Full error object:', error);
      
      // Check if it's an OAuth token issue
      if (error instanceof Error && error.message.includes('No OAuth tokens available')) {
        return res.status(401).json({ 
          error: 'OAuth authentication required. Please authenticate with Salesforce first.',
          message: 'Please click "Authenticate with Salesforce" button first.'
        });
      }

      // Handle Salesforce validation errors with user-friendly messages
      if (error instanceof Error && error.message.includes('HTTP 400:')) {
        try {
          const errorData = JSON.parse(error.message.replace('HTTP 400: ', ''));
          
          // Handle duplicate detection
          if (errorData[0]?.errorCode === 'DUPLICATES_DETECTED') {
            const entityType = errorData[0]?.duplicateResult?.duplicateRuleEntityType || 'Record';
            return res.status(400).json({
              error: 'Duplicate Record Detected',
              message: `A ${entityType} with similar information already exists in Salesforce. The system will use the existing record.`,
              details: `Salesforce found an existing ${entityType} that matches your information. This is normal and the integration will work correctly.`
            });
          }
          
          // Handle field validation errors
          if (errorData[0]?.errorCode === 'FIELD_INTEGRITY_EXCEPTION') {
            const fieldName = errorData[0]?.fields?.[0] || 'field';
            const fieldMessage = errorData[0]?.message || 'Field validation failed';
            return res.status(400).json({
              error: 'Field Validation Error',
              message: `There's an issue with the ${fieldName} field: ${fieldMessage}`,
              details: 'Please check your form data and ensure all fields contain valid information according to Salesforce requirements.'
            });
          }
          
          // Handle required field errors
          if (errorData[0]?.errorCode === 'REQUIRED_FIELD_MISSING') {
            const fieldName = errorData[0]?.fields?.[0] || 'field';
            return res.status(400).json({
              error: 'Required Field Missing',
              message: `The ${fieldName} field is required but was not provided.`,
              details: 'Please fill in all required fields and try again.'
            });
          }
          
          // Generic Salesforce error with specific message
          return res.status(400).json({
            error: 'Salesforce Validation Error',
            message: errorData[0]?.message || 'Salesforce rejected the data due to validation rules.',
            details: 'Please review your information and ensure it meets Salesforce requirements. Contact support if the issue persists.'
          });
          
        } catch (parseError) {
          // If we can't parse the error, fall back to generic message
          return res.status(400).json({
            error: 'Salesforce Error',
            message: 'Salesforce rejected the data due to validation rules.',
            details: error.message
          });
        }
      }

      // Check for other common Salesforce errors
      if (error instanceof Error) {
        if (error.message.includes('INVALID_SESSION_ID')) {
          return res.status(401).json({ 
            error: 'Salesforce session expired. Please re-authenticate.',
            requiresAuth: true
          });
        }
        
        if (error.message.includes('INSUFFICIENT_ACCESS')) {
          return res.status(403).json({ 
            error: 'Insufficient permissions in Salesforce. Please check your user permissions.',
          });
        }
      }
      
      res.status(500).json({ 
        error: 'Failed to create Account and Contact in Salesforce',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

  } catch (error: unknown) {
    console.error('=== Salesforce Error Details ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : 'Unknown error');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    console.error('Full error object:', error);
    
    // Check for specific error types
    if (error instanceof Error && error.message.includes('Missing Salesforce credentials')) {
      console.error('Environment variables check:');
      console.error('SALESFORCE_USERNAME:', process.env.SALESFORCE_USERNAME ? 'SET' : 'MISSING');
      console.error('SALESFORCE_PASSWORD:', process.env.SALESFORCE_PASSWORD ? 'SET' : 'MISSING');
      console.error('SALESFORCE_SECURITY_TOKEN:', process.env.SALESFORCE_SECURITY_TOKEN ? 'SET' : 'MISSING');
      console.error('SALESFORCE_CONSUMER_KEY:', process.env.SALESFORCE_CONSUMER_KEY ? 'SET' : 'MISSING');
      console.error('SALESFORCE_CONSUMER_SECRET:', process.env.SALESFORCE_CONSUMER_SECRET ? 'SET' : 'MISSING');
    }
    
    // Return user-friendly error messages
    let errorMessage = 'Failed to create Salesforce records';
    if (error instanceof Error && error.message.includes('authentication')) {
      errorMessage = 'Salesforce authentication failed. Please check configuration.';
    } else if (error instanceof Error && error.message.includes('DUPLICATE_VALUE')) {
      errorMessage = 'A record with this email already exists in Salesforce.';
    } else if (error instanceof Error && error.message.includes('REQUIRED_FIELD_MISSING')) {
      errorMessage = 'Required fields are missing. Please fill in all required information.';
    } else if (error instanceof Error && error.message.includes('Missing Salesforce credentials')) {
      errorMessage = 'Salesforce credentials are not properly configured.';
    }

    res.status(500).json({ 
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined,
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : 'Unknown error' : undefined
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

  } catch (error: unknown) {
    console.error('Error fetching Salesforce user records:', error);
    res.status(500).json({ 
      message: 'Failed to fetch Salesforce records',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
});

// Initiate Salesforce OAuth flow
router.post('/auth', jwtAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    const userId = user.id.toString();
    
    console.log('=== OAuth Auth Route Debug ===');
    console.log('User ID:', userId);
    console.log('User email:', user.email);
    
    const clientId = process.env.SALESFORCE_CONSUMER_KEY;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_URL 
      : (process.env.BACKEND_URL || 'http://localhost:4000');
    const redirectUri = `${baseUrl}/api/salesforce/callback`;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const state = userId.toString();
    
    if (!clientId) {
      return res.status(500).json({ error: 'Salesforce Consumer Key not configured' });
    }

    const authUrl = `${loginUrl}/services/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=api%20refresh_token`;

    console.log('Generated OAuth URL:', authUrl);
    console.log('Using callback URL:', redirectUri);
    console.log('User ID in state:', userId);
    
    // Return the OAuth URL instead of redirecting
    res.json({ authUrl });
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Salesforce OAuth token response interface
interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
  refresh_token?: string;
}

// Handle Salesforce OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;
    
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

    // Extract user ID from state parameter
    const userId = state as string || 'default';
    console.log('Extracted user ID from state:', userId);

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

    const tokenData = await tokenResponse.json() as SalesforceTokenResponse;
    console.log('Salesforce OAuth successful:', { 
      instance_url: tokenData.instance_url,
      token_type: tokenData.token_type 
    });

    // Store tokens for later use with user identification
    salesforceService.setOAuthTokens(userId, {
      access_token: tokenData.access_token,
      instance_url: tokenData.instance_url,
      refresh_token: tokenData.refresh_token
    });

    // Store tokens in session or return to frontend
    // For now, redirect back to frontend with success
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_FRONTEND_URL 
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    res.redirect(`${frontendUrl}/profile?salesforce_success=true`);
    
  } catch (error: unknown) {
    console.error('Salesforce callback error:', error);
    console.error('Full error object:', error);
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.PRODUCTION_FRONTEND_URL 
      : (process.env.FRONTEND_URL || 'http://localhost:3000');
    res.redirect(`${frontendUrl}/profile?salesforce_error=callback_failed`);
  }
});

export default router;
