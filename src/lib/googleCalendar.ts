// Google Calendar API integration service
// This service handles all Google Calendar API interactions

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  colorId?: string;
  recurrence?: string[];
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  // Custom metadata for Focus Flow integration
  extendedProperties?: {
    private?: {
      focusFlowType?: 'focus' | 'break' | 'task';
      focusFlowId?: string;
      focusFlowDuration?: string;
      focusFlowRating?: string;
    };
  };
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private readonly calendarId = 'primary';
  private tokensInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize tokens in constructor - wait until they're needed
  }

  // Initialize tokens from Appwrite user preferences (lazy loading)
  private async initializeTokens() {
    // Prevent multiple simultaneous initializations
    if (this.tokensInitialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const { GoogleCalendarTokenManager } = await import('./googleCalendarTokens');
        const tokens = await GoogleCalendarTokenManager.getTokens();
        
        if (tokens) {
          this.accessToken = tokens.access_token;
          this.refreshToken = tokens.refresh_token || null;
          this.tokenExpiry = tokens.expires_at || null;
          
          // Auto-refresh token if it's expired or about to expire
          await this.checkAndRefreshToken();
        }
        
        this.tokensInitialized = true;
      } catch (error: any) {
        // If user is not authenticated yet (401), silently skip
        if (error?.code !== 401) {
          console.error('Failed to load Google Calendar tokens:', error);
        }
        this.tokensInitialized = true;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  // Set the access token and related info (called after OAuth)
  async setAccessToken(token: string, refreshToken?: string, expiresIn?: number) {
    this.accessToken = token;
    
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    
    if (expiresIn) {
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
    }

    // Save to Appwrite preferences
    try {
      const { GoogleCalendarTokenManager } = await import('./googleCalendarTokens');
      await GoogleCalendarTokenManager.saveTokens({
        access_token: token,
        refresh_token: refreshToken,
        expires_at: this.tokenExpiry || undefined,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/calendar'
      });
      console.log('✅ Google Calendar tokens saved to Appwrite');
    } catch (error) {
      console.error('❌ Failed to save tokens to Appwrite:', error);
      // Fallback to localStorage
      localStorage.setItem('google_calendar_token', token);
      if (refreshToken) localStorage.setItem('google_calendar_refresh_token', refreshToken);
      if (this.tokenExpiry) localStorage.setItem('google_calendar_token_expiry', this.tokenExpiry.toString());
    }
  }

  // Remove access token (for disconnect)
  async clearAccessToken() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Clear from Appwrite preferences
    try {
      const { GoogleCalendarTokenManager } = await import('./googleCalendarTokens');
      await GoogleCalendarTokenManager.clearTokens();
      console.log('✅ Google Calendar tokens cleared from Appwrite');
    } catch (error) {
      console.error('❌ Failed to clear tokens from Appwrite:', error);
    }
    
    // Also clear localStorage (fallback)
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_refresh_token');
    localStorage.removeItem('google_calendar_token_expiry');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return false;
    return Date.now() > (this.tokenExpiry - 5 * 60 * 1000); // 5 minutes buffer
  }

  // Auto-refresh token if needed
  private async checkAndRefreshToken(): Promise<void> {
    if (this.refreshToken && this.isTokenExpired()) {
      try {
        // Auto-refresh expired token
        await this.refreshAccessToken();
      } catch (error) {
        // If refresh fails, clear tokens so user can re-authenticate
        this.clearAccessToken();
      }
    }
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`OAuth error: ${data.error_description || data.error}`);
    }

    // Update tokens
    this.setAccessToken(data.access_token, undefined, data.expires_in);
  }

  // Check if we have a valid token (synchronous - only checks memory)
  isAuthenticated(): boolean {
    return !!this.accessToken && !this.isTokenExpired();
  }

  // Check if we have valid tokens (async - checks Appwrite preferences)
  async hasValidTokens(): Promise<boolean> {
    try {
      await this.initializeTokens();
      return this.isAuthenticated();
    } catch (error) {
      // If we can't check tokens (e.g., user not logged in yet), return false
      return false;
    }
  }

  // Get authorization URL for OAuth
  getAuthUrl(): string {
    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    
    // Use the exact current origin to avoid redirect URI mismatches
    const redirectUri = `${window.location.origin}/auth/google-calendar`;
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CALENDAR_CLIENT_ID is not configured');
    }
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_at: number;
    token_type: string;
    scope: string;
  }> {
    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = `${window.location.origin}/auth/google-calendar`;
    
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CALENDAR_CLIENT_ID is not configured in environment variables');
    }
    
    if (!clientSecret) {
      throw new Error('VITE_GOOGLE_CALENDAR_CLIENT_SECRET is not configured in environment variables');
    }
    
    const tokenRequestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    });

    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error_description || `Token exchange failed: ${data.error || 'Unknown error'}`;
      console.error('Token exchange failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // Store both access token and refresh token
    this.setAccessToken(data.access_token, data.refresh_token, data.expires_in);
    
    // Return the full token object for storage in Appwrite
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type,
      scope: data.scope
    };
  }

  // Make authenticated request to Google Calendar API
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Initialize tokens first (lazy loading)
    await this.initializeTokens();
    
    // Check and refresh token if needed before making request
    await this.checkAndRefreshToken();
    
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Calendar');
    }

    const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token and retry once
        if (this.refreshToken) {
          try {
            await this.refreshAccessToken();
            // Retry the request with new token
            const retryResponse = await fetch(url, {
              ...options,
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
              },
            });
            
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
          }
        }
        
        // If refresh failed or no refresh token, clear tokens
        this.clearAccessToken();
        throw new Error('Google Calendar authentication expired');
      }
      throw new Error(`Google Calendar API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Get calendar events
  async getEvents(options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    orderBy?: 'startTime' | 'updated';
    singleEvents?: boolean;
    syncToken?: string;
  } = {}): Promise<GoogleCalendarListResponse> {
    const params = new URLSearchParams({
      calendarId: this.calendarId,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      ...options,
    } as any);

    return this.makeRequest(`/calendars/${this.calendarId}/events?${params.toString()}`);
  }

  // Create a new event
  async createEvent(event: GoogleCalendarEvent): Promise<GoogleCalendarEvent> {
    try {
      const result = await this.makeRequest(`/calendars/${this.calendarId}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
      
      return result;
    } catch (error) {
      console.error('Google Calendar: Failed to create event:', error);
      throw error;
    }
  }

  // Update an existing event
  async updateEvent(eventId: string, event: Partial<GoogleCalendarEvent>): Promise<GoogleCalendarEvent> {
    return this.makeRequest(`/calendars/${this.calendarId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  }

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    await this.makeRequest(`/calendars/${this.calendarId}/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // Get calendar information
  async getCalendarInfo(): Promise<any> {
    return this.makeRequest(`/calendars/${this.calendarId}`);
  }

  // Create Focus Flow specific event formats
  createFocusSessionEvent(sessionData: {
    title?: string;
    startTime: Date;
    endTime: Date;
    taskTitle?: string;
    productivity?: 'great' | 'some-distractions' | 'unfocused';
    duration: number; // in seconds
  }): GoogleCalendarEvent {
    const { title, startTime, endTime, taskTitle, productivity, duration } = sessionData;
    
    // Create a clean, professional title - use taskTitle if available
    const eventTitle = title || (taskTitle ? `🎯 ${taskTitle}` : '🎯 Focus Session');
    const durationMinutes = Math.floor(duration / 60);
    const durationHours = Math.floor(durationMinutes / 60);
    const remainingMinutes = durationMinutes % 60;
    
    // Format duration nicely
    let durationText = '';
    if (durationHours > 0) {
      durationText = `${durationHours}h ${remainingMinutes}m`;
    } else {
      durationText = `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''}`;
    }
    
    // Create comprehensive description
    let description = `🎯 **Deep Focus Session**\n\n`;
    description += `**Duration:** ${durationText}\n`;
    
    if (taskTitle) {
      description += `**Task:** ${taskTitle}\n`;
    }
    
    if (productivity) {
      const productivityEmoji = productivity === 'great' ? '🌟' : productivity === 'some-distractions' ? '⚡' : '💭';
      const productivityText = productivity === 'great' ? 'Excellent Focus - Great Work!' : productivity === 'some-distractions' ? 'Good Work with Minor Distractions' : 'Challenging Session - Keep Going!';
      description += `**Focus Quality:** ${productivityEmoji} ${productivityText}\n`;
    }
    
    description += `\n---\n`;
    description += `📊 Logged automatically by Focus Flow\n`;
    description += `💡 Track your productivity and build momentum towards your goals!`;

    return {
      summary: eventTitle,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: '2', // Green for focus sessions
      extendedProperties: {
        private: {
          focusFlowType: 'focus',
          focusFlowDuration: duration.toString(),
          focusFlowRating: productivity || '',
        },
      },
      reminders: {
        useDefault: false,
      },
    };
  }

  createBreakSessionEvent(sessionData: {
    startTime: Date;
    endTime: Date;
    type: 'short' | 'long';
    duration: number; // in seconds
  }): GoogleCalendarEvent {
    const { startTime, endTime, type, duration } = sessionData;
    const durationMinutes = Math.floor(duration / 60);
    
    const breakEmoji = type === 'short' ? '☕' : '🧘';
    const eventTitle = `${breakEmoji} ${type === 'short' ? 'Short' : 'Long'} Break`;
    
    let description = `${type === 'short' ? '☕' : '🧘'} Break Session\n\n`;
    description += `⏱️ Duration: ${durationMinutes} minutes\n`;
    description += `📅 Started: ${startTime.toLocaleString()}\n`;
    description += `🏁 Ended: ${endTime.toLocaleString()}\n`;
    description += `\n${type === 'short' ? '💡 Short breaks help maintain focus and prevent burnout.' : '🌟 Long breaks are essential for sustained productivity and mental well-being.'}\n`;
    description += `\n� Logged automatically by Focus Flow`;
    
    return {
      summary: eventTitle,
      description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: '5', // Yellow for breaks
      extendedProperties: {
        private: {
          focusFlowType: 'break',
          focusFlowDuration: duration.toString(),
        },
      },
      reminders: {
        useDefault: false,
      },
    };
  }

  // Batch operations for sync
  async batchCreateEvents(events: GoogleCalendarEvent[]): Promise<GoogleCalendarEvent[]> {
    const results = [];
    for (const event of events) {
      try {
        const created = await this.createEvent(event);
        results.push(created);
      } catch (error) {
        console.error('Failed to create event:', error);
        // Continue with other events
      }
    }
    return results;
  }

  // Check if an event was created by Focus Flow
  isFocusFlowEvent(event: GoogleCalendarEvent): boolean {
    return !!(event.extendedProperties?.private?.focusFlowType);
  }

  // Get Focus Flow events only
  async getFocusFlowEvents(options: {
    timeMin?: string;
    timeMax?: string;
  } = {}): Promise<GoogleCalendarEvent[]> {
    const response = await this.getEvents(options);
    return response.items.filter(event => this.isFocusFlowEvent(event));
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();