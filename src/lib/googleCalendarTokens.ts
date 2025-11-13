// Google Calendar Token Manager
// Stores Google Calendar OAuth tokens securely in Appwrite user preferences

import { account } from './appwrite';

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // Unix timestamp
  token_type?: string;
  scope?: string;
}

export class GoogleCalendarTokenManager {
  private static readonly PREFS_KEY = 'google_calendar_tokens';

  // Save tokens to Appwrite user preferences
  static async saveTokens(tokens: GoogleCalendarTokens): Promise<void> {
    try {
      const prefs = await account.getPrefs();
      await account.updatePrefs({
        ...prefs,
        [this.PREFS_KEY]: JSON.stringify(tokens)
      });
    } catch (error) {
      console.error('Failed to save Google Calendar tokens:', error);
      throw error;
    }
  }

  // Get tokens from Appwrite user preferences
  static async getTokens(): Promise<GoogleCalendarTokens | null> {
    try {
      const prefs = await account.getPrefs();
      const tokensJson = prefs[this.PREFS_KEY];
      
      if (!tokensJson) {
        return null;
      }

      const tokens = JSON.parse(tokensJson as string) as GoogleCalendarTokens;
      return tokens;
    } catch (error) {
      console.error('Failed to get Google Calendar tokens:', error);
      return null;
    }
  }

  // Check if tokens exist and are valid
  static async hasValidTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    
    if (!tokens || !tokens.access_token) {
      return false;
    }

    // Check if token is expired
    if (tokens.expires_at) {
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // 5 minute buffer
      if (now >= tokens.expires_at - buffer) {
        console.log('⚠️ Token expired or expiring soon');
        
        // Try to refresh if we have a refresh token
        if (tokens.refresh_token) {
          console.log('🔄 Attempting to refresh token...');
          const refreshed = await this.refreshAccessToken();
          return refreshed !== null;
        }
        
        return false;
      }
    }

    return true;
  }

  // Clear tokens
  static async clearTokens(): Promise<void> {
    try {
      const prefs = await account.getPrefs();
      delete prefs[this.PREFS_KEY];
      await account.updatePrefs(prefs);
    } catch (error) {
      console.error('Failed to clear Google Calendar tokens:', error);
    }
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(): Promise<GoogleCalendarTokens | null> {
    const tokens = await this.getTokens();
    
    if (!tokens || !tokens.refresh_token) {
      return null;
    }

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const newTokens: GoogleCalendarTokens = {
        access_token: data.access_token,
        refresh_token: tokens.refresh_token, // Keep the same refresh token
        expires_at: Date.now() + (data.expires_in * 1000),
        token_type: data.token_type,
        scope: tokens.scope,
      };

      await this.saveTokens(newTokens);

      return newTokens;
    } catch (error) {
      console.error('Failed to refresh Google Calendar token:', error);
      return null;
    }
  }

  // Get valid access token (refresh if needed)
  static async getValidAccessToken(): Promise<string | null> {
    const isValid = await this.hasValidTokens();
    
    if (!isValid) {
      // Try to refresh
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      return refreshed.access_token;
    }

    const tokens = await this.getTokens();
    return tokens?.access_token || null;
  }
}
