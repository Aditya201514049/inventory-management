import https from 'https';
import { URL, URLSearchParams } from 'url';

interface SalesforceAuthResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

interface SalesforceUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

interface SalesforceAccountData {
  Name: string;
  Type: string;
  Description: string;
  BillingStreet?: string;
  BillingCity?: string;
  BillingState?: string;
  BillingPostalCode?: string;
  BillingCountry?: string;
}

interface SalesforceContactData {
  FirstName: string;
  LastName: string;
  Email: string;
  AccountId: string;
  Description: string;
  Phone?: string;
  Title?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingState?: string;
  MailingPostalCode?: string;
  MailingCountry?: string;
}

// Helper function to make HTTP requests
const makeHttpRequest = (url: string, options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
};

class SalesforceService {
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;
  private tokenExpiry: number = 0;

  // Store OAuth tokens per user (in production, use proper session/database storage)
  private static oauthTokens: Map<string, {
    access_token?: string;
    instance_url?: string;
    refresh_token?: string;
  }> = new Map();

  static async authenticateWithOAuth(userId: string): Promise<{ accessToken: string; instanceUrl: string }> {
    console.log('=== OAuth Token Check ===');
    const userTokens = SalesforceService.oauthTokens.get(userId) || {};
    console.log('Available tokens for user:', userId, {
      hasAccessToken: !!userTokens.access_token,
      hasInstanceUrl: !!userTokens.instance_url,
      tokenKeys: Object.keys(userTokens)
    });
    
    if (!userTokens.access_token || !userTokens.instance_url) {
      console.error('OAuth tokens missing for user:', userId, {
        access_token: userTokens.access_token ? 'present' : 'missing',
        instance_url: userTokens.instance_url ? 'present' : 'missing'
      });
      throw new Error('No OAuth tokens available. Please authenticate first.');
    }

    console.log('OAuth tokens found, returning for API use');
    return {
      accessToken: userTokens.access_token,
      instanceUrl: userTokens.instance_url
    };
  }

  hasValidTokensForUser(userId: string): boolean {
    console.log('=== Token Validation Check ===');
    console.log('Checking tokens for user ID:', userId);
    console.log('All stored tokens:', Array.from(SalesforceService.oauthTokens.keys()));
    
    const userTokens = SalesforceService.oauthTokens.get(userId) || {};
    console.log('User tokens found:', {
      hasAccessToken: !!userTokens.access_token,
      hasInstanceUrl: !!userTokens.instance_url,
      tokenKeys: Object.keys(userTokens)
    });
    
    const isValid = !!(userTokens.access_token && userTokens.instance_url);
    console.log('Tokens valid:', isValid);
    
    return isValid;
  }

  private async authenticate(): Promise<void> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return;
    }

    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const clientId = process.env.SALESFORCE_CONSUMER_KEY;
    const clientSecret = process.env.SALESFORCE_CONSUMER_SECRET;

    console.log('=== Salesforce Authentication Debug ===');
    console.log('Login URL:', loginUrl);
    console.log('Consumer Key:', clientId ? `${clientId.substring(0, 10)}...` : 'MISSING');
    console.log('Consumer Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : 'MISSING');

    if (!clientId || !clientSecret) {
      const missingVars = [];
      if (!clientId) missingVars.push('SALESFORCE_CONSUMER_KEY');
      if (!clientSecret) missingVars.push('SALESFORCE_CONSUMER_SECRET');
      
      console.error('Missing environment variables:', missingVars);
      throw new Error(`Missing Salesforce credentials in environment variables: ${missingVars.join(', ')}`);
    }

    // Use Client Credentials flow instead of Username-Password flow
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      console.log('Making client credentials authentication request to:', `${loginUrl}/services/oauth2/token`);
      
      const authData = await makeHttpRequest(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }) as SalesforceAuthResponse;

      this.accessToken = authData.access_token;
      this.instanceUrl = authData.instance_url;
      this.tokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

      console.log('Salesforce authentication successful');
      console.log('Instance URL:', this.instanceUrl);
      console.log('Token expires at:', new Date(this.tokenExpiry).toISOString());
    } catch (error: any) {
      console.error('Client credentials authentication failed, trying username-password flow...');
      
      // Fallback to username-password flow
      await this.authenticateWithPassword();
    }
  }

  private async authenticateWithPassword(): Promise<void> {
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN;
    const clientId = process.env.SALESFORCE_CONSUMER_KEY;
    const clientSecret = process.env.SALESFORCE_CONSUMER_SECRET;

    console.log('=== Fallback Username-Password Authentication ===');
    console.log('Username:', username ? `${username.substring(0, 5)}...` : 'MISSING');
    console.log('Password:', password ? 'SET' : 'MISSING');
    console.log('Security Token:', securityToken ? `${securityToken.substring(0, 5)}...` : 'MISSING');

    if (!username || !password || !securityToken || !clientId || !clientSecret) {
      const missingVars = [];
      if (!username) missingVars.push('SALESFORCE_USERNAME');
      if (!password) missingVars.push('SALESFORCE_PASSWORD');
      if (!securityToken) missingVars.push('SALESFORCE_SECURITY_TOKEN');
      if (!clientId) missingVars.push('SALESFORCE_CONSUMER_KEY');
      if (!clientSecret) missingVars.push('SALESFORCE_CONSUMER_SECRET');
      
      console.error('Missing environment variables:', missingVars);
      throw new Error(`Missing Salesforce credentials in environment variables: ${missingVars.join(', ')}`);
    }

    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password + securityToken,
    });

    try {
      console.log('Making username-password authentication request...');
      
      const authData = await makeHttpRequest(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }) as SalesforceAuthResponse;

      this.accessToken = authData.access_token;
      this.instanceUrl = authData.instance_url;
      this.tokenExpiry = Date.now() + 3600000;

      console.log('Username-password authentication successful');
      console.log('Instance URL:', this.instanceUrl);
    } catch (error) {
      console.error('Both authentication methods failed:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    await this.authenticate();

    if (!this.accessToken || !this.instanceUrl) {
      throw new Error('Not authenticated with Salesforce');
    }

    const url = `${this.instanceUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      console.log('Making request to:', url);
      console.log('Request method:', method);
      console.log('Request data:', data);

      const response = await makeHttpRequest(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error(`Salesforce API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async createAccountAndContact(userData: SalesforceUserData): Promise<{ accountId: string; contactId: string }> {
    try {
      // Create Account first
      const accountData: SalesforceAccountData = {
        Name: userData.company || `${userData.firstName} ${userData.lastName} Account`,
        Type: 'Customer',
        Description: 'Account created from Inventory Management System',
      };

      if (userData.address) {
        if (userData.address.street) accountData.BillingStreet = userData.address.street;
        if (userData.address.city) accountData.BillingCity = userData.address.city;
        if (userData.address.state) accountData.BillingState = userData.address.state;
        if (userData.address.postalCode) accountData.BillingPostalCode = userData.address.postalCode;
        if (userData.address.country) accountData.BillingCountry = userData.address.country;
      }

      const accountResponse = await this.makeRequest('/services/data/v58.0/sobjects/Account', 'POST', accountData);
      const accountId = accountResponse.id;

      // Create Contact linked to the Account
      const contactData: SalesforceContactData = {
        FirstName: userData.firstName,
        LastName: userData.lastName,
        Email: userData.email,
        AccountId: accountId,
        Description: 'Contact created from Inventory Management System',
      };

      if (userData.phone) contactData.Phone = userData.phone;
      if (userData.jobTitle) contactData.Title = userData.jobTitle;

      if (userData.address) {
        if (userData.address.street) contactData.MailingStreet = userData.address.street;
        if (userData.address.city) contactData.MailingCity = userData.address.city;
        if (userData.address.state) contactData.MailingState = userData.address.state;
        if (userData.address.postalCode) contactData.MailingPostalCode = userData.address.postalCode;
        if (userData.address.country) contactData.MailingCountry = userData.address.country;
      }

      const contactResponse = await this.makeRequest('/services/data/v58.0/sobjects/Contact', 'POST', contactData);
      const contactId = contactResponse.id;

      console.log(`Created Salesforce Account (${accountId}) and Contact (${contactId}) for ${userData.email}`);

      return { accountId, contactId };
    } catch (error) {
      console.error('Error creating Salesforce Account and Contact:', error);
      throw error;
    }
  }

  async createAccountAndContactWithOAuth(userData: SalesforceUserData, userId: string): Promise<{ accountId: string; contactId: string; salesforceUrl: string }> {
    try {
      // Use OAuth tokens instead of username/password authentication
      const { accessToken, instanceUrl } = await SalesforceService.authenticateWithOAuth(userId);
      
      console.log('Using OAuth authentication for Salesforce API calls');
      
      // Create Account
      const accountData = {
        Name: userData.company || `${userData.firstName} ${userData.lastName}`,
        BillingStreet: userData.address?.street,
        BillingCity: userData.address?.city,
        BillingState: userData.address?.state,
        BillingPostalCode: userData.address?.postalCode,
        BillingCountry: userData.address?.country,
      };

      console.log('Creating Account with data:', accountData);
      let accountResult;
      
      try {
        accountResult = await this.makeAuthenticatedRequest(
          `${instanceUrl}/services/data/v58.0/sobjects/Account/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(accountData),
          }
        );
      } catch (error: any) {
        // Handle duplicate detection
        if (error.message.includes('DUPLICATES_DETECTED')) {
          console.log('Duplicate Account detected, extracting existing Account ID...');
          const errorData = JSON.parse(error.message.replace('HTTP 400: ', ''));
          const duplicateId = errorData[0]?.duplicateResult?.matchResults?.[0]?.matchRecords?.[0]?.record?.Id;
          
          if (duplicateId) {
            console.log('Using existing Account ID:', duplicateId);
            accountResult = { id: duplicateId };
          } else {
            throw new Error('Failed to extract duplicate Account ID');
          }
        } else {
          throw error;
        }
      }

      if (!accountResult.id) {
        throw new Error('Failed to create Account - no ID returned');
      }

      console.log('Account ID obtained:', accountResult.id);

      // Create Contact
      const contactData = {
        FirstName: userData.firstName,
        LastName: userData.lastName,
        Email: userData.email,
        Phone: userData.phone,
        Title: userData.jobTitle,
        AccountId: accountResult.id,
      };

      console.log('Creating Contact with data:', contactData);
      let contactResult;
      
      try {
        contactResult = await this.makeAuthenticatedRequest(
          `${instanceUrl}/services/data/v58.0/sobjects/Contact/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData),
          }
        );
      } catch (error: any) {
        // Handle duplicate detection for Contact
        if (error.message.includes('DUPLICATES_DETECTED')) {
          console.log('Duplicate Contact detected, extracting existing Contact ID...');
          const errorData = JSON.parse(error.message.replace('HTTP 400: ', ''));
          const duplicateId = errorData[0]?.duplicateResult?.matchResults?.[0]?.matchRecords?.[0]?.record?.Id;
          
          if (duplicateId) {
            console.log('Using existing Contact ID:', duplicateId);
            contactResult = { id: duplicateId };
          } else {
            throw new Error('Failed to extract duplicate Contact ID');
          }
        } else {
          throw error;
        }
      }

      if (!contactResult.id) {
        throw new Error('Failed to create Contact - no ID returned');
      }

      console.log('Contact ID obtained:', contactResult.id);

      return {
        accountId: accountResult.id,
        contactId: contactResult.id,
        salesforceUrl: `${instanceUrl}/${contactResult.id}`,
      };
    } catch (error) {
      console.error('Error in createAccountAndContactWithOAuth:', error);
      throw error;
    }
  }

  private async makeAuthenticatedRequest(url: string, options: any): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? require('https') : require('http');
        
        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: options.headers || {},
        };

        const req = httpModule.request(requestOptions, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const jsonData = JSON.parse(data);
                resolve(jsonData);
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${data}`));
              }
            } catch (error) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          });
        });

        req.on('error', (error: any) => reject(error));
        
        if (options.body) {
          req.write(options.body);
        }
        
        req.end();
      });
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      // Test with a simple query
      await this.makeRequest('/services/data/v58.0/sobjects/Account/describe');
      return true;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }

  setOAuthTokens(userId: string, tokens: { access_token: string; instance_url: string; refresh_token?: string }) {
    SalesforceService.oauthTokens.set(userId, tokens);
    console.log('OAuth tokens stored successfully for user:', userId);
  }
}

export default new SalesforceService();
